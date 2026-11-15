import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Linking, Pressable, SafeAreaView, ScrollView, Share,
  StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { GlassView } from "expo-glass-effect";

type Tab = "Home" | "Discover" | "Daily" | "Connect" | "Tools" | "Profile" | "Privacy";
type Archetype = "Explorer" | "Creator" | "Connector" | "Strategist";
type Post = { id: string; text: string; author: string; date: string };
const C = { bg:"#070914", panel:"#111626", panel2:"#1A2235", border:"rgba(205,214,238,0.12)", text:"#F5F7FC", muted:"#9AA7BA", purple:"#A996FF", cyan:"#8ADCE8", green:"#70D6B0", gold:"#F2CD83", red:"#FF9AA8" };
const KEY = "allin-native-v1";
const questions = [
  {q:"A free weekend appears. What do you do?",a:["Explore somewhere new","Start a creative project","Bring friends together","Plan a big personal goal"]},
  {q:"In a group project, you naturally…",a:["Find unexpected angles","Shape the look and feel","Keep everyone connected","Build the plan"]},
  {q:"Pick a superpower.",a:["Teleportation","Create anything from nothing","Understand every language","See the future"]},
  {q:"When you're stuck, you…",a:["Change your surroundings","Sketch new ideas","Talk it through","Break it into steps"]},
  {q:"Which compliment means most?",a:["You're fearless","That's original","You make people feel welcome","You're always prepared"]},
  {q:"Your most-used app is probably…",a:["Maps","Camera or design","Messages","Calendar or notes"]},
  {q:"You learn best by…",a:["Trying it yourself","Making something","Learning with others","Understanding the system"]},
  {q:"You'd love to be remembered for…",a:["What you discovered","What you created","Who you brought together","What you solved"]}
];
const types: Archetype[] = ["Explorer","Creator","Connector","Strategist"];
const profiles: Record<Archetype,{emoji:string;tag:string;desc:string;traits:string[]}> = {
  Explorer:{emoji:"🧭",tag:"Curiosity is your compass.",desc:"You chase the new and unknown. Fresh places, ideas and experiences recharge you, and you turn uncertainty into adventure.",traits:["Adaptable","Bold","Open-minded"]},
  Creator:{emoji:"🎨",tag:"You make what didn't exist yesterday.",desc:"You see possibilities everywhere and love bringing them to life. Expression, craft and originality are how you leave your mark.",traits:["Imaginative","Expressive","Original"]},
  Connector:{emoji:"🤝",tag:"People are your superpower.",desc:"You build bridges and make others feel seen. Your energy grows when it is shared, and communities form around you.",traits:["Empathetic","Warm","Collaborative"]},
  Strategist:{emoji:"♟️",tag:"You see the board three moves ahead.",desc:"You love systems, patterns and smart plans. You turn complexity into clear, confident decisions.",traits:["Analytical","Focused","Decisive"]}
};
const words = ["ORBIT","PIXEL","SPARK","QUEST","BLOOM","CRANE","FROST","GLOBE","HONEY","LUNAR","MAPLE","NOVEL","OCEAN","PRISM","RIVER","SOLAR","TIGER","VIVID","WALTZ","YOUTH","AMBER","BRAVE","CORAL","DREAM","EMBER","FLAME","GRAPE","HAVEN","IVORY","JOLLY","LEMON","MIRTH","NORTH","OPERA","PLANT","QUIET","RADAR","SHINE","TRAIL","UNITY","VAPOR","WHEAT","STORM","CLOUD","BEACH","CANDY","DELTA","EAGLE","FAITH","GHOST","HEART","JUICE","KAYAK","LIGHT","MUSIC","NIGHT"];
const polls = [
  {q:"If you could master one skill overnight, which would it be?",a:["A new language","An instrument","Cooking","Coding"]},
  {q:"Best way to spend a rainy afternoon?",a:["Reading","Gaming","Napping","Baking"]},
  {q:"Which era would you visit for a day?",a:["Ancient Egypt","The Renaissance","The 1980s","Year 3000"]},
  {q:"Pick a travel style.",a:["Backpacking","Luxury escape","Road trip","Staycation"]},
  {q:"What makes a perfect friendship?",a:["Honesty","Shared humor","Loyalty","Adventure together"]}
];
const today = () => { const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const dayNumber = (s:string) => { const [y,m,d]=s.split("-").map(Number); return Math.floor((Date.UTC(y,m-1,d)-Date.UTC(2024,0,1))/86400000); };
const puzzle = () => words[((dayNumber(today())*37)%words.length+words.length)%words.length];
type AppData = {name:string;answers:number[];result:Archetype|null;activeDays:string[];completedPuzzle:string;puzzleDay:string;guesses:string[];votes:Record<string,number>;posts:Post[]};
const initial: AppData = {name:"Guest",answers:[],result:null,activeDays:[],completedPuzzle:"",puzzleDay:"",guesses:[],votes:{},posts:[]};

function Button({title,onPress,kind="primary",small=false,disabled=false}:{title:string;onPress:()=>void;kind?:"primary"|"secondary"|"ghost";small?:boolean;disabled?:boolean}) {
  return <Pressable disabled={disabled} onPress={()=>{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});onPress();}} style={({pressed})=>[styles.button,kind==="secondary"&&styles.buttonSecondary,kind==="ghost"&&styles.buttonGhost,small&&styles.buttonSmall,disabled&&{opacity:.35},pressed&&{opacity:.75,transform:[{scale:.985}]}]}><Text style={[styles.buttonText,kind!=="primary"&&{color:C.text},small&&{fontSize:12}]}>{title}</Text></Pressable>;
}
function Card({children,style}:any){return <View style={[styles.card,style]}>{children}</View>}
function Eyebrow({children}:any){return <Text style={styles.eyebrow}>{children}</Text>}
function Heading({children}:any){return <Text style={styles.heading}>{children}</Text>}
function Meter({value,total=8}:{value:number;total?:number}){return <View style={styles.meter}><View style={[styles.meterFill,{width:(value/total*100)+"%"}]}/></View>}

export default function App({initialTab,onNavigate}:{initialTab:Tab;onNavigate:(tab:Tab)=>void}) {
  const tab=initialTab;
  const [data,setData]=useState<AppData>(initial);
  const [quizStarted,setQuizStarted]=useState(initialTab==="Discover");
  const [loaded,setLoaded]=useState(false);
  const [quizIndex,setQuizIndex]=useState(0);
  const [quizAnswers,setQuizAnswers]=useState<number[]>([]);
  const [guess,setGuess]=useState("");
  const [guesses,setGuesses]=useState<string[]>([]);
  const [tool,setTool]=useState<"Text counter"|"Percent calculator"|"Decision picker">("Text counter");
  const [textValue,setTextValue]=useState("");
  const [numA,setNumA]=useState("15");
  const [numB,setNumB]=useState("80");
  const [choices,setChoices]=useState("Stay curious\nBuild something\nTake a break");
  const [picked,setPicked]=useState("");
  const [postText,setPostText]=useState("");
  const [nameDraft,setNameDraft]=useState("Guest");
  
  useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v){const p=JSON.parse(v);setData({...initial,...p});setNameDraft(p.name||"Guest");setGuesses(p.puzzleDay===today()&&Array.isArray(p.guesses)?p.guesses:[]);}}).catch(()=>{}).finally(()=>setLoaded(true));},[]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(KEY,JSON.stringify(data)).catch(()=>{});},[data,loaded]);
  const activeDay=useMemo(()=>today(),[]);
  const pollIndex=((dayNumber(activeDay)%polls.length)+polls.length)%polls.length;
  const poll=polls[pollIndex];
  const streak=useMemo(()=>{const set=new Set(data.activeDays.map(dayNumber));let n=dayNumber(activeDay);if(!set.has(n))n--;let s=0;while(set.has(n)){s++;n--;}return s;},[data.activeDays,activeDay]);
  const markActive=()=>setData(d=>({...d,activeDays:Array.from(new Set([...d.activeDays,activeDay]))}));
  const score=(answers:number[])=>{const counts=[0,0,0,0];answers.forEach((a,i)=>{if(a>=0)counts[a]++;});let best=0;for(let i=1;i<4;i++)if(counts[i]>counts[best])best=i;return types[best];};
  const finishQuiz=(answers:number[])=>{const result=score(answers);setData(d=>({...d,answers,result}));markActive();setQuizAnswers([]);setQuizIndex(0);setQuizStarted(false);};
  const beginQuiz=()=>{setQuizAnswers([]);setQuizIndex(0);setQuizStarted(true);onNavigate("Discover");};
  const chooseAnswer=(n:number)=>{const next=[...quizAnswers,n];if(quizIndex===questions.length-1){finishQuiz(next);}else{setQuizAnswers(next);setQuizIndex(quizIndex+1);}};
  const submitGuess=()=>{const g=guess.trim().toUpperCase();if(!/^[A-Z]{5}$/.test(g)){Alert.alert("Five letters needed","Enter a five-letter word using A–Z.");return;}if(guesses.includes(g)){Alert.alert("Already tried","Choose a different word.");return;}if(guesses.length>=6||data.completedPuzzle===activeDay)return;const next=[...guesses,g];setGuesses(next);setGuess("");setData(d=>({...d,guesses:next,puzzleDay:activeDay,...(g===puzzle()?{completedPuzzle:activeDay}:{})}));markActive();if(g===puzzle()){Alert.alert("You got it!","Today's word is "+g+". Come back tomorrow for a new one.");}else if(next.length===6){Alert.alert("Good try","Today's word was "+puzzle()+". A new one arrives tomorrow.");setData(d=>({...d,completedPuzzle:activeDay,guesses:next,puzzleDay:activeDay}));}};
  const letterStates=(g:string)=>{const answer=puzzle();const states=Array(5).fill("absent");const remaining:Record<string,number>={};for(let i=0;i<5;i++){if(g[i]===answer[i])states[i]="correct";else remaining[answer[i]]=(remaining[answer[i]]||0)+1;}for(let i=0;i<5;i++){if(states[i]!=="correct"&&remaining[g[i]]>0){states[i]="present";remaining[g[i]]--;}}return states;};
  const shareResult=async()=>{if(!data.result)return;const p=profiles[data.result];try{await Share.share({message:"I'm "+data.result+" "+p.emoji+" on ALLIN — "+p.tag+" Find your type in ALLIN!"});}catch{}};
  const vote=(i:number)=>{setData(d=>({...d,votes:{...d.votes,[activeDay]:i}}));markActive();};
  const addPost=()=>{const t=postText.trim();if(!t)return;if(t.length>280){Alert.alert("Too long","Keep your post under 280 characters.");return;}setData(d=>({...d,posts:[{id:String(Date.now()),text:t,author:d.name||"Guest",date:activeDay},...d.posts]}));setPostText("");markActive();};
  const saveName=()=>{setData(d=>({...d,name:nameDraft.trim().slice(0,24)||"Guest"}));Alert.alert("Saved","Your profile name has been updated.");};
  const reset=()=>Alert.alert("Reset ALLIN?","This deletes your local profile, results, votes and posts from this device.",[{text:"Cancel",style:"cancel"},{text:"Reset",style:"destructive",onPress:()=>{setData(initial);setNameDraft("Guest");setGuesses([]);onNavigate("Home");}}]);
  const stats=textValue.trim()?{words:textValue.trim().split(/\s+/).length,chars:Array.from(textValue).length,noSpaces:Array.from(textValue.replace(/\s/g,"")).length}: {words:0,chars:0,noSpaces:0};
  const percent=(Number(numA)||0)/100*(Number(numB)||0);

  if(!loaded)return <SafeAreaView style={styles.safe}><StatusBar style="light"/><View style={styles.center}><Text style={styles.brand}>ALLIN</Text><Text style={styles.muted}>Getting your space ready…</Text></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe}><StatusBar style="light"/><View style={styles.app}>
    <View pointerEvents="none" style={styles.ambientOne}/><View pointerEvents="none" style={styles.ambientTwo}/>
    <View style={styles.topbar}><Pressable onPress={()=>onNavigate("Home")}><Text style={styles.brand}>ALLIN<Text style={{color:C.cyan}}>.</Text></Text></Pressable><GlassView style={styles.topRightGlass} glassEffectStyle="regular" tintColor="rgba(151,132,255,0.12)"><View style={styles.topRight}><View style={styles.streak}><SymbolView name={{ios:"flame.fill",android:"local_fire_department",web:"local_fire_department"}} tintColor={C.gold} size={14}/><Text style={styles.streakNumber}>{streak}</Text></View><Pressable onPress={()=>onNavigate("Profile")} style={styles.avatar}><Text style={styles.avatarText}>{(data.name||"G").slice(0,1).toUpperCase()}</Text></Pressable></View></GlassView></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {tab==="Privacy"&&<View>
        <Eyebrow>PRIVACY · YOUR DATA</Eyebrow><Heading>Your data stays yours.</Heading>
        <Card><Text style={styles.cardTitle}>Stored on this iPhone</Text><Text style={styles.body}>ALLIN stores your display name, identity quiz answers and result, daily puzzle progress, reflection selections, private journal entries, streaks and activity counters in the app storage on this device.</Text><Text style={styles.body}>This release has no account system, cloud sync, advertising SDK, analytics SDK or background tracking. Your data is not sent to an ALLIN server.</Text></Card>
        <Card><Text style={styles.cardTitle}>Sharing is your choice</Text><Text style={styles.body}>If you tap Share, iOS opens its system share sheet. Only the content you choose to share is passed to the app or service you select.</Text></Card>
        <Card><Text style={styles.cardTitle}>Delete your data</Text><Text style={styles.body}>Open Profile and choose Reset all local data to clear your ALLIN profile, quiz result, votes, posts and activity stored on this device.</Text><Text style={styles.muted}>There is no cloud account to delete in this release. Device backups are managed by Apple.</Text></Card>
        <Button title="Open full privacy policy" kind="secondary" small onPress={()=>Linking.openURL("https://github.com/karam-G/universal-ai-ios/blob/main/PRIVACY.md").catch(()=>{})}/><Button title="Get support" kind="ghost" small onPress={()=>Linking.openURL("https://github.com/karam-G/universal-ai-ios/issues").catch(()=>{})}/><Button title="Back to Profile" kind="secondary" onPress={()=>onNavigate("Profile")}/>
      </View>}
      {tab==="Home"&&<View>
        <View style={styles.homeIntro}>
          <View style={{flex:1}}>
            <Eyebrow>YOUR DAILY SPACE</Eyebrow>
            <Text style={styles.homeGreeting}>Good to see you,{"\n"}{data.name==="Guest"?"there":data.name}.</Text>
            <Text style={styles.muted}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</Text>
          </View>
          <View style={styles.homeAvatar}><Text style={styles.homeAvatarText}>{(data.name||"G").slice(0,1).toUpperCase()}</Text></View>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroTopline}><View style={styles.liveDot}/><Text style={styles.heroKicker}>A FRESH START, EVERY DAY</Text></View>
          <Text style={styles.heroTitle}>Make today{"\n"}<Text style={styles.gradientText}>count.</Text></Text>
          <Text style={styles.heroCopy}>Discover something about yourself, solve a small challenge, or make progress on something that matters.</Text>
          <Button title="Open today's challenge  →" onPress={()=>onNavigate("Daily")}/>
          <View style={styles.heroOrb}><SymbolView name={{ios:"sparkles",android:"auto_awesome",web:"auto_awesome"}} tintColor={C.purple} size={42} weight="semibold"/></View>
        </View>
        <View style={styles.statGrid}>
          <View style={styles.stat}><Text style={styles.statValue}>{streak}</Text><Text style={styles.statLabel}>DAY STREAK</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{data.activeDays.length}</Text><Text style={styles.statLabel}>ACTIVE DAYS</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{data.result?"1":"0"}</Text><Text style={styles.statLabel}>DISCOVERIES</Text></View>
        </View>
        <View style={styles.sectionHeader}><View><Eyebrow>YOUR NEXT MOVE</Eyebrow><Heading>Pick up where you left off</Heading></View></View>
        <Pressable onPress={()=>onNavigate("Daily")}><Card style={styles.featureCard}>
          <View style={[styles.featureIcon,{backgroundColor:"rgba(138,220,232,0.10)"}]}><SymbolView name={{ios:"square.grid.3x3.fill",android:"grid_view",web:"grid_view"}} tintColor={C.cyan} size={25}/></View>
          <View style={{flex:1}}><Text style={styles.cardTitle}>{data.completedPuzzle===activeDay?"Today's challenge complete":"The daily word challenge"}</Text><Text style={styles.muted}>{data.completedPuzzle===activeDay?"A new puzzle arrives tomorrow.":guesses.length+" of 6 attempts used — continue your game."}</Text></View>
          <Text style={styles.arrow}>›</Text>
        </Card></Pressable>
        <View style={styles.sectionHeader}><View><Eyebrow>EXPLORE ALLIN</Eyebrow><Heading>Your space, your pace</Heading></View></View>
        <View style={styles.grid}>
          {([{t:"Discover",s:"sparkles",a:"auto_awesome",d:"Understand your style",c:"#A996FF",tag:"01"},{t:"Journal",s:"book.closed",a:"menu_book",d:"Keep thoughts private",c:"#8ADCE8",tag:"02"},{t:"Tools",s:"slider.horizontal.3",a:"tune",d:"Everyday utilities",c:"#70D6B0",tag:"03"},{t:"Daily",s:"calendar",a:"today",d:"Build a daily rhythm",c:"#F2CD83",tag:"04"}] as any[]).map(x=><Pressable key={x.t} style={styles.gridItem} onPress={()=>onNavigate((x.t==="Journal"?"Connect":x.t) as Tab)}><View style={styles.gridTop}><SymbolView name={{ios:x.s,android:x.a,web:x.a}} tintColor={x.c} size={24} weight="semibold"/><Text style={styles.gridNumber}>{x.tag}</Text></View><Text style={styles.cardTitle}>{x.t}</Text><Text style={styles.muted}>{x.d}</Text></Pressable>)}
        </View>
        <Card style={styles.identityCard}>
          <View style={styles.identityHeader}><Eyebrow>YOUR PERSONALITY SNAPSHOT</Eyebrow><Text style={styles.identitySpark}>✦</Text></View>
          <Text style={styles.cardTitle}>{data.result?profiles[data.result].emoji+"  "+data.result:"A little self-discovery goes a long way"}</Text>
          <Text style={styles.muted}>{data.result?profiles[data.result].tag:"Take the short 8-question experience and get a personality-style snapshot."}</Text>
          <Button title={data.result?"View your result":"Discover your type"} kind="secondary" small onPress={()=>onNavigate("Discover")}/>
        </Card>
        <Text style={styles.homeFootnote}>ALLIN IS YOURS · PRIVATE BY DESIGN · NO SUBSCRIPTION</Text>
      </View>}

      {tab==="Discover"&&<View><Eyebrow>DISCOVER · SELF KNOWLEDGE</Eyebrow><Heading>What's your inner type?</Heading><Text style={styles.body}>Eight quick choices. One result that gives you a new angle on yourself. Just for fun—not a psychological assessment.</Text>
        {data.result&&!quizStarted&&<Card style={styles.resultCard}><Text style={{fontSize:34}}>{profiles[data.result].emoji}</Text><Eyebrow>YOUR CURRENT TYPE</Eyebrow><Text style={styles.heroTitleSmall}>{data.result}</Text><Text style={styles.cardTitle}>{profiles[data.result].tag}</Text><Text style={styles.body}>{profiles[data.result].desc}</Text><View style={styles.traits}>{profiles[data.result].traits.map(t=><Text key={t} style={styles.trait}>{t}</Text>)}</View><Button title="Share my result ↗" onPress={shareResult}/><Button title="Retake the test" kind="ghost" onPress={()=>{setQuizAnswers([]);setQuizIndex(0);setQuizStarted(true);}}/></Card>}
        {quizStarted||!data.result?<Card><View style={styles.sectionRow}><Eyebrow>QUESTION {quizIndex+1} OF 8</Eyebrow><Text style={styles.muted}>{Math.round((quizIndex+1)/8*100)}%</Text></View><Meter value={quizIndex+1}/><Text style={styles.question}>{questions[quizIndex].q}</Text>{questions[quizIndex].a.map((a,i)=><Pressable key={a} onPress={()=>{Haptics.selectionAsync().catch(()=>{});chooseAnswer(i);}} style={({pressed})=>[styles.option,pressed&&{borderColor:C.purple,backgroundColor:"#25203D"}]}><Text style={styles.optionLetter}>{String.fromCharCode(65+i)}</Text><Text style={styles.optionText}>{a}</Text><Text style={styles.arrow}>›</Text></Pressable>)}</Card>:null}
      </View>}

      {tab==="Daily"&&<View><Eyebrow>DAILY · PUZZLE #{dayNumber(activeDay)+1}</Eyebrow><Heading>Five letters. Six tries.</Heading><Text style={styles.body}>Find today's hidden word. Purple means the letter is in the word; green means it's in the right place.</Text>
        <Card><View style={styles.guessBoard}>{Array.from({length:6},(_,r)=><View key={r} style={styles.guessRow}>{Array.from({length:5},(_,i)=>{const g=guesses[r]||"";const state=g?letterStates(g)[i]:"empty";return <View key={i} style={[styles.letterBox,state==="correct"&&styles.letterCorrect,state==="present"&&styles.letterPresent,state==="absent"&&styles.letterAbsent]}><Text style={styles.letterText}>{g?g[i]:r===guesses.length?guess[i]||"":""}</Text></View>})}</View>)}</View>
        {data.completedPuzzle===activeDay?<Text style={styles.success}>✓ Today's challenge completed. See you tomorrow.</Text>:<><TextInput value={guess} onChangeText={v=>setGuess(v.toUpperCase().replace(/[^A-Z]/g,"").slice(0,5))} placeholder="TYPE A 5-LETTER WORD" placeholderTextColor={C.muted} autoCapitalize="characters" maxLength={5} style={styles.input}/><Button title="Submit guess" onPress={submitGuess} disabled={guess.length!==5}/></>}
        <Text style={styles.muted}>Attempts used: {guesses.length}/6</Text></Card>
        <Card><Eyebrow>HOW TO PLAY</Eyebrow><Text style={styles.body}>🟩 Right letter, right place{"\n"}🟪 In the word, different place{"\n"}⬛ Not in today's word</Text></Card>
      </View>}

      {tab==="Connect"&&<View><Eyebrow>JOURNAL · PRIVATE SPACE</Eyebrow><Heading>A space for your thoughts.</Heading><Text style={styles.body}>Use the daily prompt to reflect, or write a note to yourself. Your entries are saved only on this iPhone and are never published.</Text>
        <Card><Eyebrow>DAILY REFLECTION</Eyebrow><Text style={styles.question}>{poll.q}</Text><Text style={styles.muted}>Choose the answer that feels right today. Your selection stays private.</Text>{poll.a.map((a,i)=><Pressable key={a} onPress={()=>{Haptics.selectionAsync().catch(()=>{});vote(i);}} style={[styles.option,data.votes[activeDay]===i&&styles.optionSelected]}><Text style={styles.optionText}>{a}</Text>{data.votes[activeDay]===i&&<Text style={{color:C.cyan}}>✓</Text>}</Pressable>)}{data.votes[activeDay]!==undefined&&<Text style={styles.success}>Your reflection is saved on this device.</Text>}</Card>
        <Card><Eyebrow>NEW PRIVATE ENTRY</Eyebrow><TextInput value={postText} onChangeText={setPostText} placeholder="Write a private note…" placeholderTextColor={C.muted} multiline maxLength={280} style={[styles.input,{height:100,textAlignVertical:"top"}]}/><View style={styles.sectionRow}><Text style={styles.muted}>{postText.length}/280</Text><Button title="Save entry" onPress={addPost} small disabled={!postText.trim()}/></View></Card>
        <Heading>Your entries</Heading>{data.posts.length?data.posts.map(p=><Card key={p.id}><View style={styles.sectionRow}><Text style={styles.cardTitle}>{p.author}</Text><View style={{flexDirection:"row",alignItems:"center",gap:12}}><Text style={styles.muted}>{p.date}</Text><Pressable onPress={()=>Alert.alert("Delete entry?","This entry will be removed from this iPhone.",[{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:()=>setData(d=>({...d,posts:d.posts.filter(x=>x.id!==p.id)}))}])}><Text style={{color:C.red,fontSize:10,fontWeight:"900",letterSpacing:0.8}}>DELETE</Text></Pressable></View></View><Text style={styles.body}>{p.text}</Text></Card>):<Card><Text style={styles.muted}>Nothing here yet. Your first entry can start small.</Text></Card>}
      </View>}

      {tab==="Tools"&&<View><Eyebrow>TOOLS · EVERYDAY HELPERS</Eyebrow><Heading>Useful little things.</Heading><Text style={styles.body}>Three simple tools. No account, no API, no subscription.</Text>
        <View style={styles.toolTabs}>{(["Text counter","Percent calculator","Decision picker"] as const).map(t=><Pressable key={t} onPress={()=>{setTool(t);setPicked("");}} style={[styles.toolTab,tool===t&&styles.toolTabActive]}>{tool===t&&<GlassView pointerEvents="none" style={StyleSheet.absoluteFill} glassEffectStyle="regular" tintColor="rgba(169,150,255,0.16)"/>}<Text style={[styles.toolTabText,tool===t&&{color:C.text}]}>{t}</Text></Pressable>)}</View>
        <Card>{tool==="Text counter"?<><Text style={styles.cardTitle}>Text & word counter</Text><TextInput value={textValue} onChangeText={setTextValue} multiline placeholder="Paste or type your text here…" placeholderTextColor={C.muted} style={[styles.input,{height:150,textAlignVertical:"top"}]}/><View style={styles.statGrid}>{[["WORDS",stats.words],["CHARACTERS",stats.chars],["NO SPACES",stats.noSpaces]].map(([k,v])=><View key={String(k)} style={styles.stat}><Text style={styles.statValue}>{v}</Text><Text style={styles.muted}>{k}</Text></View>)}</View></>:tool==="Percent calculator"?<><Text style={styles.cardTitle}>What's X% of Y?</Text><Text style={styles.muted}>Enter a percentage and a number.</Text><TextInput value={numA} onChangeText={setNumA} keyboardType="decimal-pad" style={styles.input} placeholder="Percentage"/><TextInput value={numB} onChangeText={setNumB} keyboardType="decimal-pad" style={styles.input} placeholder="Number"/><View style={styles.resultBox}><Eyebrow>RESULT</Eyebrow><Text style={styles.heroTitleSmall}>{Number.isFinite(percent)?Number(percent.toFixed(2)):0}</Text></View></>:<><Text style={styles.cardTitle}>Let chance decide.</Text><Text style={styles.muted}>Add options separated by commas or new lines.</Text><TextInput value={choices} onChangeText={setChoices} multiline style={[styles.input,{height:130,textAlignVertical:"top"}]}/><Button title="Pick for me" onPress={()=>{const a=choices.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);setPicked(a.length?a[Math.floor(Math.random()*a.length)]:"Add at least one option.");}}/><View style={styles.resultBox}><Eyebrow>THE PICK</Eyebrow><Text style={styles.cardTitle}>{picked||"Waiting for your options…"}</Text></View></>}</Card>
      </View>}

      {tab==="Profile"&&<View><Eyebrow>PROFILE · YOUR SPACE</Eyebrow><Heading>Make it yours.</Heading><Card><View style={styles.profileAvatar}><Text style={{fontSize:30}}>{(data.name||"G").slice(0,1).toUpperCase()}</Text></View><Text style={styles.cardTitle}>Your display name</Text><TextInput value={nameDraft} onChangeText={setNameDraft} maxLength={24} style={styles.input} placeholder="Your name"/><Button title="Save name" onPress={saveName} small/></Card>
        <View style={styles.statGrid}><View style={styles.stat}><Text style={styles.statValue}>{streak}</Text><Text style={styles.muted}>DAY STREAK</Text></View><View style={styles.stat}><Text style={styles.statValue}>{data.activeDays.length}</Text><Text style={styles.muted}>ACTIVE DAYS</Text></View><View style={styles.stat}><Text style={styles.statValue}>{data.posts.length}</Text><Text style={styles.muted}>JOURNAL ENTRIES</Text></View></View>
        <Card><Eyebrow>YOUR IDENTITY</Eyebrow><Text style={styles.cardTitle}>{data.result?profiles[data.result].emoji+" "+data.result:"Not discovered yet"}</Text><Text style={styles.muted}>{data.result?profiles[data.result].tag:"Take the identity test to save your result."}</Text><Button title="Open identity test" kind="secondary" small onPress={beginQuiz}/></Card>
        <Card><Eyebrow>ABOUT ALLIN</Eyebrow><Text style={styles.body}>ALLIN is a private daily companion for self-discovery, small challenges, reflection and useful everyday tools. Your profile and journal stay on this device. No account or subscription is required.</Text><Text style={styles.muted}>Version 0.4.0 · Built for iPhone</Text><Button title="Privacy & data" kind="secondary" small onPress={()=>onNavigate("Privacy")}/><Button title="Reset all local data" kind="ghost" onPress={reset}/></Card>
      </View>}
    </ScrollView>
  </View></SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},app:{flex:1,backgroundColor:C.bg,overflow:"hidden"},ambientOne:{position:"absolute",top:-150,left:-130,width:360,height:360,borderRadius:180,backgroundColor:"rgba(117,88,255,0.11)"},ambientTwo:{position:"absolute",top:260,right:-190,width:340,height:340,borderRadius:170,backgroundColor:"rgba(67,190,215,0.07)"},center:{flex:1,alignItems:"center",justifyContent:"center"},topbar:{height:72,paddingHorizontal:22,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:0},brand:{fontSize:25,fontWeight:"900",letterSpacing:2.4,color:C.text},homeIntro:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:3},homeGreeting:{fontSize:31,lineHeight:37,fontWeight:"800",letterSpacing:-1.1,color:C.text,marginBottom:5},homeAvatar:{width:52,height:52,borderRadius:18,backgroundColor:"rgba(169,150,255,0.15)",borderWidth:1,borderColor:"rgba(169,150,255,0.35)",alignItems:"center",justifyContent:"center"},homeAvatarText:{fontSize:20,fontWeight:"900",color:C.purple},heroTopline:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:17},liveDot:{width:7,height:7,borderRadius:4,backgroundColor:C.green},heroKicker:{fontSize:9,fontWeight:"900",letterSpacing:1.4,color:C.cyan},sectionHeader:{marginTop:3,marginBottom:0},gridTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:4},gridNumber:{fontSize:10,color:"#59657D",fontWeight:"800",letterSpacing:1},identityCard:{borderColor:"rgba(169,150,255,0.23)",backgroundColor:"#14182A"},identityHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},identitySpark:{fontSize:20,color:C.purple},homeFootnote:{fontSize:9,color:"#68748B",letterSpacing:1.2,textAlign:"center",fontWeight:"800",marginTop:5},topRightGlass:{borderRadius:24,overflow:"hidden",padding:5,borderWidth:1,borderColor:"rgba(255,255,255,0.12)"},topRight:{flexDirection:"row",alignItems:"center",gap:10},streak:{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:"#2C241A",paddingHorizontal:10,paddingVertical:7,borderRadius:14,borderWidth:1,borderColor:"#51412B"},streakNumber:{color:C.gold,fontWeight:"800",fontSize:12},avatar:{width:32,height:32,borderRadius:16,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.border},avatarText:{color:C.cyan,fontWeight:"800"},content:{paddingHorizontal:20,paddingTop:12,paddingBottom:52,gap:20},hero:{backgroundColor:"#15182B",borderRadius:30,padding:25,overflow:"hidden",borderWidth:1,borderColor:"rgba(183,168,255,0.22)",minHeight:330,justifyContent:"center",shadowColor:"#7866F5",shadowOpacity:0.18,shadowRadius:30,shadowOffset:{width:0,height:16},elevation:8},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.7,color:C.cyan,marginBottom:9},heroTitle:{fontSize:39,lineHeight:45,fontWeight:"900",color:C.text,letterSpacing:-1.6,marginBottom:12},gradientText:{color:C.purple},heroTitleSmall:{fontSize:30,fontWeight:"900",color:C.text,marginVertical:6},heroCopy:{color:"#C2C6D9",fontSize:14,lineHeight:23,maxWidth:260,marginBottom:22},heroOrb:{position:"absolute",right:18,top:32,width:92,height:92,borderRadius:46,borderWidth:1,borderColor:"rgba(169,150,255,0.28)",backgroundColor:"rgba(169,150,255,0.10)",alignItems:"center",justifyContent:"center",overflow:"hidden"},card:{backgroundColor:"rgba(19,25,42,0.94)",borderRadius:24,borderWidth:1,borderColor:"rgba(196,207,233,0.13)",padding:19,marginBottom:13,gap:11,shadowColor:"#000000",shadowOpacity:0.16,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:4},featureCard:{flexDirection:"row",alignItems:"center",gap:12},featureIcon:{width:52,height:52,borderRadius:18,alignItems:"center",justifyContent:"center",overflow:"hidden",borderWidth:1,borderColor:"rgba(255,255,255,0.12)"},cardTitle:{fontSize:16,fontWeight:"800",color:C.text},muted:{fontSize:12,color:C.muted,lineHeight:18},body:{fontSize:14,color:"#B7BDD4",lineHeight:22,marginBottom:10},heading:{fontSize:27,fontWeight:"800",color:C.text,letterSpacing:-.8,marginBottom:9},sectionRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:10},arrow:{fontSize:24,color:C.muted},button:{backgroundColor:C.purple,paddingHorizontal:20,paddingVertical:15,borderRadius:17,alignItems:"center",justifyContent:"center",marginTop:7,overflow:"hidden"},buttonSecondary:{backgroundColor:"rgba(132,112,220,0.16)",borderWidth:1,borderColor:"rgba(190,178,255,0.28)"},buttonGhost:{backgroundColor:"rgba(255,255,255,0.035)",borderWidth:1,borderColor:"rgba(205,214,238,0.16)"},buttonSmall:{paddingVertical:10,paddingHorizontal:14,alignSelf:"flex-start"},buttonText:{fontSize:14,fontWeight:"800",color:"#FFFFFF"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},gridItem:{width:"48%",backgroundColor:"#111727",padding:17,borderRadius:22,borderWidth:1,borderColor:"rgba(196,207,233,0.12)",minHeight:138,justifyContent:"center",gap:7},gridIcon:{fontSize:26,marginBottom:10},resultCard:{borderColor:"#594B8C"},traits:{flexDirection:"row",flexWrap:"wrap",gap:7,marginVertical:6},trait:{color:C.cyan,backgroundColor:"#1C2B3B",paddingHorizontal:11,paddingVertical:7,borderRadius:20,fontSize:11,fontWeight:"700"},meter:{height:5,backgroundColor:C.panel2,borderRadius:4,overflow:"hidden",marginBottom:15},meterFill:{height:5,backgroundColor:C.purple,borderRadius:4},question:{fontSize:20,fontWeight:"800",color:C.text,lineHeight:28,marginVertical:12},option:{flexDirection:"row",alignItems:"center",gap:12,padding:15,borderRadius:17,borderWidth:1,borderColor:"rgba(205,214,238,0.13)",backgroundColor:"rgba(25,31,51,0.82)",marginBottom:9,minHeight:58},optionSelected:{borderColor:"rgba(138,220,232,0.7)",backgroundColor:"rgba(35,72,83,0.55)"},optionLetter:{width:25,height:25,borderRadius:8,backgroundColor:C.panel2,color:C.cyan,textAlign:"center",textAlignVertical:"center",fontWeight:"900"},optionText:{flex:1,color:C.text,fontSize:13,fontWeight:"600"},guessBoard:{gap:7,alignItems:"center",marginBottom:18},guessRow:{flexDirection:"row",gap:7},letterBox:{width:47,height:47,borderRadius:10,borderWidth:1,borderColor:C.border,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},letterText:{fontSize:20,fontWeight:"900",color:C.text},letterCorrect:{backgroundColor:"#246A56",borderColor:C.green},letterPresent:{backgroundColor:"#493C79",borderColor:C.purple},letterAbsent:{backgroundColor:"#30354A",borderColor:"#4A5065"},input:{backgroundColor:"rgba(8,12,25,0.82)",borderWidth:1,borderColor:"rgba(205,214,238,0.15)",borderRadius:16,padding:15,color:C.text,fontSize:15,marginVertical:8},success:{color:C.green,fontWeight:"800",fontSize:12,marginVertical:8},toolTabs:{flexDirection:"row",gap:6,marginBottom:10},toolTab:{flex:1,paddingVertical:12,paddingHorizontal:5,borderRadius:15,backgroundColor:"rgba(19,25,42,0.92)",borderWidth:1,borderColor:"rgba(205,214,238,0.12)",alignItems:"center"},toolTabActive:{backgroundColor:"rgba(110,87,190,0.34)",borderColor:"rgba(190,178,255,0.5)"},toolTabText:{fontSize:10,color:C.muted,fontWeight:"700",textAlign:"center"},statGrid:{flexDirection:"row",justifyContent:"space-around",gap:6,marginVertical:10},stat:{flex:1,backgroundColor:"#111727",borderRadius:17,padding:13,alignItems:"center",borderWidth:1,borderColor:"rgba(196,207,233,0.10)"},statValue:{fontSize:24,fontWeight:"900",color:C.text,marginBottom:4},statLabel:{fontSize:9,color:C.muted,fontWeight:"800",letterSpacing:1.1},resultBox:{backgroundColor:"rgba(104,82,179,0.2)",borderRadius:18,padding:18,marginTop:13,borderWidth:1,borderColor:"rgba(190,178,255,0.2)"},profileAvatar:{width:65,height:65,borderRadius:22,backgroundColor:"#30264F",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.purple},nav:{height:66,paddingHorizontal:3,paddingBottom:Platform.OS==="ios"?4:2,backgroundColor:"#0D1020",borderTopWidth:1,borderTopColor:C.border,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},navItem:{flex:1,alignItems:"center",justifyContent:"center",gap:3},navIcon:{fontSize:19,color:C.muted},navLabel:{fontSize:9,color:C.muted,fontWeight:"700"},navActive:{color:C.cyan}
});