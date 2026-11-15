import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Pressable, SafeAreaView, ScrollView, Share,
  StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

type Tab = "Home" | "Discover" | "Daily" | "Connect" | "Tools" | "Profile";
type Archetype = "Explorer" | "Creator" | "Connector" | "Strategist";
type Post = { id: string; text: string; author: string; date: string };
const C = { bg:"#090B16", panel:"#121629", panel2:"#191F36", border:"#272E49", text:"#F4F5FF", muted:"#929AB8", purple:"#9B7BFF", cyan:"#65D9E8", green:"#65D6A5", gold:"#F5C979", red:"#FF8D9B" };
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
type AppData = {name:string;answers:number[];result:Archetype|null;activeDays:string[];completedPuzzle:string;votes:Record<string,number>;posts:Post[]};
const initial: AppData = {name:"Guest",answers:[],result:null,activeDays:[],completedPuzzle:"",votes:{},posts:[]};

function Button({title,onPress,kind="primary",small=false,disabled=false}:{title:string;onPress:()=>void;kind?:"primary"|"secondary"|"ghost";small?:boolean;disabled?:boolean}) {
  return <Pressable disabled={disabled} onPress={onPress} style={({pressed})=>[styles.button,kind==="secondary"&&styles.buttonSecondary,kind==="ghost"&&styles.buttonGhost,small&&styles.buttonSmall,disabled&&{opacity:.35},pressed&&{opacity:.75,transform:[{scale:.985}]}]}><Text style={[styles.buttonText,kind!=="primary"&&{color:C.text},small&&{fontSize:12}]}>{title}</Text></Pressable>;
}
function Card({children,style}:any){return <View style={[styles.card,style]}>{children}</View>}
function Eyebrow({children}:any){return <Text style={styles.eyebrow}>{children}</Text>}
function Heading({children}:any){return <Text style={styles.heading}>{children}</Text>}
function Meter({value,total=8}:{value:number;total?:number}){return <View style={styles.meter}><View style={[styles.meterFill,{width:(value/total*100)+"%"}]}/></View>}

export default function App() {
  const [tab,setTab]=useState<Tab>("Home");
  const [data,setData]=useState<AppData>(initial);
  const [quizStarted,setQuizStarted]=useState(false);
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
  
  useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v){const p=JSON.parse(v);setData({...initial,...p});setNameDraft(p.name||"Guest");}}).catch(()=>{}).finally(()=>setLoaded(true));},[]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(KEY,JSON.stringify(data)).catch(()=>{});},[data,loaded]);
  const activeDay=useMemo(()=>today(),[]);
  const pollIndex=((dayNumber(activeDay)%polls.length)+polls.length)%polls.length;
  const poll=polls[pollIndex];
  const streak=useMemo(()=>{const set=new Set(data.activeDays.map(dayNumber));let n=dayNumber(activeDay);if(!set.has(n))n--;let s=0;while(set.has(n)){s++;n--;}return s;},[data.activeDays,activeDay]);
  const markActive=()=>setData(d=>({...d,activeDays:Array.from(new Set([...d.activeDays,activeDay]))}));
  const score=(answers:number[])=>{const counts=[0,0,0,0];answers.forEach((a,i)=>{if(a>=0)counts[a]++;});let best=0;for(let i=1;i<4;i++)if(counts[i]>counts[best])best=i;return types[best];};
  const finishQuiz=(answers:number[])=>{const result=score(answers);setData(d=>({...d,answers,result}));markActive();setQuizAnswers([]);setQuizIndex(0);setQuizStarted(false);};
  const beginQuiz=()=>{setQuizAnswers([]);setQuizIndex(0);setQuizStarted(true);setTab("Discover");};
  const chooseAnswer=(n:number)=>{const next=[...quizAnswers,n];if(quizIndex===questions.length-1){finishQuiz(next);}else{setQuizAnswers(next);setQuizIndex(quizIndex+1);}};
  const submitGuess=()=>{const g=guess.trim().toUpperCase();if(!/^[A-Z]{5}$/.test(g)){Alert.alert("Five letters needed","Enter a five-letter word using A–Z.");return;}if(guesses.includes(g)){Alert.alert("Already tried","Choose a different word.");return;}if(guesses.length>=6||data.completedPuzzle===activeDay)return;const next=[...guesses,g];setGuesses(next);setGuess("");markActive();if(g===puzzle()){setData(d=>({...d,completedPuzzle:activeDay}));Alert.alert("You got it!","Today's word is "+g+". Come back tomorrow for a new one.");}else if(next.length===6){Alert.alert("Good try","Today's word was "+puzzle()+". A new one arrives tomorrow.");setData(d=>({...d,completedPuzzle:activeDay}));}};
  const letterState=(g:string,i:number)=>{const a=puzzle();if(g[i]===a[i])return "correct";if(a.includes(g[i]))return "present";return "absent";};
  const shareResult=async()=>{if(!data.result)return;const p=profiles[data.result];try{await Share.share({message:"I'm "+data.result+" "+p.emoji+" on ALLIN — "+p.tag+" Find your type in ALLIN!"});}catch{}};
  const vote=(i:number)=>{setData(d=>({...d,votes:{...d.votes,[activeDay]:i}}));markActive();};
  const addPost=()=>{const t=postText.trim();if(!t)return;if(t.length>280){Alert.alert("Too long","Keep your post under 280 characters.");return;}setData(d=>({...d,posts:[{id:String(Date.now()),text:t,author:d.name||"Guest",date:activeDay},...d.posts]}));setPostText("");markActive();};
  const saveName=()=>{setData(d=>({...d,name:nameDraft.trim().slice(0,24)||"Guest"}));Alert.alert("Saved","Your profile name has been updated.");};
  const reset=()=>Alert.alert("Reset ALLIN?","This deletes your local profile, results, votes and posts from this device.",[{text:"Cancel",style:"cancel"},{text:"Reset",style:"destructive",onPress:()=>{setData(initial);setNameDraft("Guest");setGuesses([]);setTab("Home");}}]);
  const stats=textValue.trim()?{words:textValue.trim().split(/\s+/).length,chars:Array.from(textValue).length,noSpaces:Array.from(textValue.replace(/\s/g,"")).length}: {words:0,chars:0,noSpaces:0};
  const percent=(Number(numA)||0)/100*(Number(numB)||0);
  const nav:Tab[]=["Home","Discover","Daily","Connect","Tools","Profile"];
  const icons:Record<Tab,string>={Home:"⌂",Discover:"✦",Daily:"◷",Connect:"◎",Tools:"▦",Profile:"◉"};

  if(!loaded)return <SafeAreaView style={styles.safe}><StatusBar style="light"/><View style={styles.center}><Text style={styles.brand}>ALLIN</Text><Text style={styles.muted}>Getting your space ready…</Text></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe}><StatusBar style="light"/><View style={styles.app}>
    <View style={styles.topbar}><Pressable onPress={()=>setTab("Home")}><Text style={styles.brand}>ALLIN<Text style={{color:C.cyan}}>.</Text></Text></Pressable><View style={styles.topRight}><Text style={styles.streak}>🔥 {streak}</Text><View style={styles.avatar}><Text style={styles.avatarText}>{(data.name||"G").slice(0,1).toUpperCase()}</Text></View></View></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {tab==="Home"&&<View>
        <View style={styles.hero}><Eyebrow>YOUR SPACE TO EXPLORE</Eyebrow><Text style={styles.heroTitle}>One place.{"\n"}Endless <Text style={styles.gradientText}>possibilities.</Text></Text><Text style={styles.heroCopy}>A little discovery, a little play, and something useful every day.</Text><Button title="Discover your type  →" onPress={beginQuiz}/><View style={styles.heroOrb}><Text style={{fontSize:48}}>✳</Text></View></View>
        <View style={styles.sectionRow}><Heading>Pick up where you left off</Heading><Text style={styles.muted}>TODAY</Text></View>
        <Pressable onPress={()=>setTab("Daily")}><Card style={styles.featureCard}><View style={styles.featureIcon}><Text style={{fontSize:25}}>🧩</Text></View><View style={{flex:1}}><Eyebrow>DAILY CHALLENGE</Eyebrow><Text style={styles.cardTitle}>A fresh puzzle awaits</Text><Text style={styles.muted}>Six tries. Five letters. Can you crack it?</Text></View><Text style={styles.arrow}>↗</Text></Card></Pressable>
        <Heading>Explore ALLIN</Heading><View style={styles.grid}>
          {([{t:"Discover",e:"✦",d:"Find your inner type",c:"#9B7BFF"},{t:"Connect",e:"◎",d:"Have your say",c:"#65D9E8"},{t:"Tools",e:"▦",d:"Small tools, big help",c:"#65D6A5"},{t:"Daily",e:"◷",d:"A new challenge",c:"#F5C979"}] as any[]).map(x=><Pressable key={x.t} style={styles.gridItem} onPress={()=>setTab(x.t)}><Text style={[styles.gridIcon,{color:x.c}]}>{x.e}</Text><Text style={styles.cardTitle}>{x.t}</Text><Text style={styles.muted}>{x.d}</Text></Pressable>)}
        </View>
        <Card style={{marginTop:16}}><Eyebrow>YOUR JOURNEY</Eyebrow><Text style={styles.cardTitle}>{data.result?profiles[data.result].emoji+" "+data.result:"Your story starts here"}</Text><Text style={styles.muted}>{data.result?"Your identity result is saved on this device.":"Take the identity test and discover your archetype."}</Text><Button title={data.result?"Retake identity test":"Take the identity test"} onPress={beginQuiz} kind="secondary" small/></Card>
      </View>}

      {tab==="Discover"&&<View><Eyebrow>DISCOVER · SELF KNOWLEDGE</Eyebrow><Heading>What's your inner type?</Heading><Text style={styles.body}>Eight quick choices. One result that gives you a new angle on yourself. Just for fun—not a psychological assessment.</Text>
        {data.result&&!quizStarted&&<Card style={styles.resultCard}><Text style={{fontSize:34}}>{profiles[data.result].emoji}</Text><Eyebrow>YOUR CURRENT TYPE</Eyebrow><Text style={styles.heroTitleSmall}>{data.result}</Text><Text style={styles.cardTitle}>{profiles[data.result].tag}</Text><Text style={styles.body}>{profiles[data.result].desc}</Text><View style={styles.traits}>{profiles[data.result].traits.map(t=><Text key={t} style={styles.trait}>{t}</Text>)}</View><Button title="Share my result ↗" onPress={shareResult}/><Button title="Retake the test" kind="ghost" onPress={()=>{setQuizAnswers([]);setQuizIndex(0);setQuizStarted(true);}}/></Card>}
        {quizStarted||!data.result?<Card><View style={styles.sectionRow}><Eyebrow>QUESTION {quizIndex+1} OF 8</Eyebrow><Text style={styles.muted}>{Math.round((quizIndex+1)/8*100)}%</Text></View><Meter value={quizIndex+1}/><Text style={styles.question}>{questions[quizIndex].q}</Text>{questions[quizIndex].a.map((a,i)=><Pressable key={a} onPress={()=>chooseAnswer(i)} style={({pressed})=>[styles.option,pressed&&{borderColor:C.purple,backgroundColor:"#25203D"}]}><Text style={styles.optionLetter}>{String.fromCharCode(65+i)}</Text><Text style={styles.optionText}>{a}</Text><Text style={styles.arrow}>›</Text></Pressable>)}</Card>:null}
      </View>}

      {tab==="Daily"&&<View><Eyebrow>DAILY · PUZZLE #{dayNumber(activeDay)+1}</Eyebrow><Heading>Five letters. Six tries.</Heading><Text style={styles.body}>Find today's hidden word. Purple means the letter is in the word; green means it's in the right place.</Text>
        <Card><View style={styles.guessBoard}>{Array.from({length:6},(_,r)=><View key={r} style={styles.guessRow}>{Array.from({length:5},(_,i)=>{const g=guesses[r]||"";const state=g?letterState(g,i):"empty";return <View key={i} style={[styles.letterBox,state==="correct"&&styles.letterCorrect,state==="present"&&styles.letterPresent,state==="absent"&&styles.letterAbsent]}><Text style={styles.letterText}>{g?g[i]:r===guesses.length?guess[i]||"":""}</Text></View>})}</View>)}</View>
        {data.completedPuzzle===activeDay?<Text style={styles.success}>✓ Today's challenge completed. See you tomorrow.</Text>:<><TextInput value={guess} onChangeText={v=>setGuess(v.toUpperCase().replace(/[^A-Z]/g,"").slice(0,5))} placeholder="TYPE A 5-LETTER WORD" placeholderTextColor={C.muted} autoCapitalize="characters" maxLength={5} style={styles.input}/><Button title="Submit guess" onPress={submitGuess} disabled={guess.length!==5}/></>}
        <Text style={styles.muted}>Attempts used: {guesses.length}/6</Text></Card>
        <Card><Eyebrow>HOW TO PLAY</Eyebrow><Text style={styles.body}>🟩 Right letter, right place{"\n"}🟪 In the word, different place{"\n"}⬛ Not in today's word</Text></Card>
      </View>}

      {tab==="Connect"&&<View><Eyebrow>CONNECT · COMMUNITY</Eyebrow><Heading>Have your say.</Heading><Text style={styles.body}>One question for everyone, every day. Your votes and posts are currently saved only on this device.</Text>
        <Card><Eyebrow>QUESTION OF THE DAY</Eyebrow><Text style={styles.question}>{poll.q}</Text>{poll.a.map((a,i)=><Pressable key={a} onPress={()=>vote(i)} style={[styles.option,data.votes[activeDay]===i&&styles.optionSelected]}><Text style={styles.optionText}>{a}</Text>{data.votes[activeDay]===i&&<Text style={{color:C.cyan}}>✓</Text>}</Pressable>)}{data.votes[activeDay]!==undefined&&<Text style={styles.success}>Your vote is saved on this device.</Text>}</Card>
        <Card><Eyebrow>START A CONVERSATION</Eyebrow><TextInput value={postText} onChangeText={setPostText} placeholder="What's on your mind? (280 characters)" placeholderTextColor={C.muted} multiline maxLength={280} style={[styles.input,{height:100,textAlignVertical:"top"}]}/><View style={styles.sectionRow}><Text style={styles.muted}>{postText.length}/280</Text><Button title="Post locally" onPress={addPost} small disabled={!postText.trim()}/></View></Card>
        <Heading>Your local posts</Heading>{data.posts.length?data.posts.map(p=><Card key={p.id}><View style={styles.sectionRow}><Text style={styles.cardTitle}>{p.author}</Text><Text style={styles.muted}>{p.date}</Text></View><Text style={styles.body}>{p.text}</Text></Card>):<Card><Text style={styles.muted}>No posts yet. Start the first conversation.</Text></Card>}
      </View>}

      {tab==="Tools"&&<View><Eyebrow>TOOLS · EVERYDAY HELPERS</Eyebrow><Heading>Useful little things.</Heading><Text style={styles.body}>Three simple tools. No account, no API, no subscription.</Text>
        <View style={styles.toolTabs}>{(["Text counter","Percent calculator","Decision picker"] as const).map(t=><Pressable key={t} onPress={()=>{setTool(t);setPicked("");}} style={[styles.toolTab,tool===t&&styles.toolTabActive]}><Text style={[styles.toolTabText,tool===t&&{color:C.text}]}>{t}</Text></Pressable>)}</View>
        <Card>{tool==="Text counter"?<><Text style={styles.cardTitle}>Text & word counter</Text><TextInput value={textValue} onChangeText={setTextValue} multiline placeholder="Paste or type your text here…" placeholderTextColor={C.muted} style={[styles.input,{height:150,textAlignVertical:"top"}]}/><View style={styles.statGrid}>{[["WORDS",stats.words],["CHARACTERS",stats.chars],["NO SPACES",stats.noSpaces]].map(([k,v])=><View key={String(k)} style={styles.stat}><Text style={styles.statValue}>{v}</Text><Text style={styles.muted}>{k}</Text></View>)}</View></>:tool==="Percent calculator"?<><Text style={styles.cardTitle}>What's X% of Y?</Text><Text style={styles.muted}>Enter a percentage and a number.</Text><TextInput value={numA} onChangeText={setNumA} keyboardType="decimal-pad" style={styles.input} placeholder="Percentage"/><TextInput value={numB} onChangeText={setNumB} keyboardType="decimal-pad" style={styles.input} placeholder="Number"/><View style={styles.resultBox}><Eyebrow>RESULT</Eyebrow><Text style={styles.heroTitleSmall}>{Number.isFinite(percent)?Number(percent.toFixed(2)):0}</Text></View></>:<><Text style={styles.cardTitle}>Let chance decide.</Text><Text style={styles.muted}>Add options separated by commas or new lines.</Text><TextInput value={choices} onChangeText={setChoices} multiline style={[styles.input,{height:130,textAlignVertical:"top"}]}/><Button title="Pick for me ✦" onPress={()=>{const a=choices.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);setPicked(a.length?a[Math.floor(Math.random()*a.length)]:"Add at least one option.");}}/><View style={styles.resultBox}><Eyebrow>THE PICK</Eyebrow><Text style={styles.cardTitle}>{picked||"Waiting for your options…"}</Text></View></>}</Card>
      </View>}

      {tab==="Profile"&&<View><Eyebrow>PROFILE · YOUR SPACE</Eyebrow><Heading>Make it yours.</Heading><Card><View style={styles.profileAvatar}><Text style={{fontSize:30}}>{(data.name||"G").slice(0,1).toUpperCase()}</Text></View><Text style={styles.cardTitle}>Your display name</Text><TextInput value={nameDraft} onChangeText={setNameDraft} maxLength={24} style={styles.input} placeholder="Your name"/><Button title="Save name" onPress={saveName} small/></Card>
        <View style={styles.statGrid}><View style={styles.stat}><Text style={styles.statValue}>{streak}</Text><Text style={styles.muted}>DAY STREAK</Text></View><View style={styles.stat}><Text style={styles.statValue}>{data.activeDays.length}</Text><Text style={styles.muted}>ACTIVE DAYS</Text></View><View style={styles.stat}><Text style={styles.statValue}>{data.posts.length}</Text><Text style={styles.muted}>LOCAL POSTS</Text></View></View>
        <Card><Eyebrow>YOUR IDENTITY</Eyebrow><Text style={styles.cardTitle}>{data.result?profiles[data.result].emoji+" "+data.result:"Not discovered yet"}</Text><Text style={styles.muted}>{data.result?profiles[data.result].tag:"Take the identity test to save your result."}</Text><Button title="Open identity test" kind="secondary" small onPress={beginQuiz}/></Card>
        <Card><Eyebrow>ABOUT ALLIN</Eyebrow><Text style={styles.body}>ALLIN is an independent experiment built around discovery, play, useful tools and community. This first build stores your data locally on this device. Community content is not shared between users yet.</Text><Text style={styles.muted}>Version 0.1.0 · Local-first preview</Text><Button title="Reset all local data" kind="ghost" onPress={reset}/></Card>
      </View>}
    </ScrollView>
    <View style={styles.nav}>{nav.map(n=><Pressable key={n} onPress={()=>setTab(n)} style={styles.navItem}><Text style={[styles.navIcon,tab===n&&styles.navActive]}>{icons[n]}</Text><Text style={[styles.navLabel,tab===n&&styles.navActive]}>{n}</Text></Pressable>)}</View>
  </View></SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},app:{flex:1,backgroundColor:C.bg},center:{flex:1,alignItems:"center",justifyContent:"center"},topbar:{height:58,paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:C.border},brand:{fontSize:23,fontWeight:"900",letterSpacing:2,color:C.text},topRight:{flexDirection:"row",alignItems:"center",gap:12},streak:{color:C.gold,fontWeight:"800"},avatar:{width:32,height:32,borderRadius:16,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.border},avatarText:{color:C.cyan,fontWeight:"800"},content:{padding:18,paddingBottom:30,gap:16},hero:{backgroundColor:"#17162D",borderRadius:26,padding:22,overflow:"hidden",borderWidth:1,borderColor:"#38305D",minHeight:270,justifyContent:"center"},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.7,color:C.cyan,marginBottom:9},heroTitle:{fontSize:36,lineHeight:42,fontWeight:"900",color:C.text,letterSpacing:-1.2,marginBottom:10},gradientText:{color:C.purple},heroTitleSmall:{fontSize:30,fontWeight:"900",color:C.text,marginVertical:6},heroCopy:{color:"#B5B8D0",fontSize:14,lineHeight:22,maxWidth:250,marginBottom:18},heroOrb:{position:"absolute",right:12,top:28,width:112,height:112,borderRadius:56,borderWidth:1,borderColor:"#5D4A99",backgroundColor:"#282044",alignItems:"center",justifyContent:"center",opacity:.65},card:{backgroundColor:C.panel,borderRadius:20,borderWidth:1,borderColor:C.border,padding:17,marginBottom:12,gap:10},featureCard:{flexDirection:"row",alignItems:"center",gap:12},featureIcon:{width:48,height:48,borderRadius:15,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:16,fontWeight:"800",color:C.text},muted:{fontSize:12,color:C.muted,lineHeight:18},body:{fontSize:14,color:"#B7BDD4",lineHeight:22,marginBottom:10},heading:{fontSize:24,fontWeight:"900",color:C.text,letterSpacing:-.5,marginBottom:8},sectionRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:10},arrow:{fontSize:24,color:C.muted},button:{backgroundColor:C.purple,paddingHorizontal:18,paddingVertical:14,borderRadius:14,alignItems:"center",justifyContent:"center",marginTop:6},buttonSecondary:{backgroundColor:C.panel2,borderWidth:1,borderColor:C.border},buttonGhost:{backgroundColor:"transparent",borderWidth:1,borderColor:C.border},buttonSmall:{paddingVertical:10,paddingHorizontal:14,alignSelf:"flex-start"},buttonText:{fontSize:14,fontWeight:"800",color:"#FFFFFF"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},gridItem:{width:"48%",backgroundColor:C.panel,padding:15,borderRadius:18,borderWidth:1,borderColor:C.border,minHeight:118},gridIcon:{fontSize:26,marginBottom:10},resultCard:{borderColor:"#594B8C"},traits:{flexDirection:"row",flexWrap:"wrap",gap:7,marginVertical:6},trait:{color:C.cyan,backgroundColor:"#1C2B3B",paddingHorizontal:11,paddingVertical:7,borderRadius:20,fontSize:11,fontWeight:"700"},meter:{height:5,backgroundColor:C.panel2,borderRadius:4,overflow:"hidden",marginBottom:15},meterFill:{height:5,backgroundColor:C.purple,borderRadius:4},question:{fontSize:20,fontWeight:"800",color:C.text,lineHeight:28,marginVertical:12},option:{flexDirection:"row",alignItems:"center",gap:12,padding:14,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:"#151A2D",marginBottom:8,minHeight:54},optionSelected:{borderColor:C.cyan,backgroundColor:"#172A35"},optionLetter:{width:25,height:25,borderRadius:8,backgroundColor:C.panel2,color:C.cyan,textAlign:"center",textAlignVertical:"center",fontWeight:"900"},optionText:{flex:1,color:C.text,fontSize:13,fontWeight:"600"},guessBoard:{gap:7,alignItems:"center",marginBottom:18},guessRow:{flexDirection:"row",gap:7},letterBox:{width:47,height:47,borderRadius:10,borderWidth:1,borderColor:C.border,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},letterText:{fontSize:20,fontWeight:"900",color:C.text},letterCorrect:{backgroundColor:"#246A56",borderColor:C.green},letterPresent:{backgroundColor:"#493C79",borderColor:C.purple},letterAbsent:{backgroundColor:"#30354A",borderColor:"#4A5065"},input:{backgroundColor:"#0E1221",borderWidth:1,borderColor:C.border,borderRadius:13,padding:13,color:C.text,fontSize:14,marginVertical:7},success:{color:C.green,fontWeight:"800",fontSize:12,marginVertical:8},toolTabs:{flexDirection:"row",gap:6,marginBottom:10},toolTab:{flex:1,paddingVertical:10,paddingHorizontal:5,borderRadius:12,backgroundColor:C.panel,borderWidth:1,borderColor:C.border,alignItems:"center"},toolTabActive:{backgroundColor:"#30264F",borderColor:C.purple},toolTabText:{fontSize:10,color:C.muted,fontWeight:"700",textAlign:"center"},statGrid:{flexDirection:"row",justifyContent:"space-around",gap:6,marginVertical:10},stat:{flex:1,backgroundColor:C.panel2,borderRadius:14,padding:12,alignItems:"center"},statValue:{fontSize:23,fontWeight:"900",color:C.text,marginBottom:4},resultBox:{backgroundColor:"#201B39",borderRadius:15,padding:16,marginTop:12},profileAvatar:{width:65,height:65,borderRadius:22,backgroundColor:"#30264F",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.purple},nav:{height:66,paddingHorizontal:3,paddingBottom:Platform.OS==="ios"?4:2,backgroundColor:"#0D1020",borderTopWidth:1,borderTopColor:C.border,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},navItem:{flex:1,alignItems:"center",justifyContent:"center",gap:3},navIcon:{fontSize:19,color:C.muted},navLabel:{fontSize:9,color:C.muted,fontWeight:"700"},navActive:{color:C.cyan}
});