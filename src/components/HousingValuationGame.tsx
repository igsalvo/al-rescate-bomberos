import { useState } from "react";
import { ArrowRight, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";
import { housingExamples, housingRounds, type HouseCase } from "../config/housing";
import { clampScore } from "../game/common";

type GameResult = { score: number; title: string; metrics: Array<[string, string | number]>; explanation: string };

function HouseProfile({ house }: { house: HouseCase }) {
  return <div className="housing-profile">
    <div className="housing-illustration"><span>{house.icon}</span><i/><b/></div>
    <div><small>VIVIENDA FICTICIA</small><h3>{house.label}</h3><dl><div><dt>Superficie</dt><dd>{house.size} m²</dd></div><div><dt>Habitaciones</dt><dd>{house.rooms}</dd></div><div><dt>Transporte</dt><dd>{house.transport}</dd></div><div><dt>Áreas verdes</dt><dd>{house.greenAreas}</dd></div><div><dt>Distancia al centro</dt><dd>{house.centerDistance} km</dd></div><div><dt>Estado</dt><dd>{house.condition}</dd></div></dl></div>
  </div>;
}

function FactorBars({ house }: { house: HouseCase }) {
  return <div className="housing-factors">{house.factors.map(factor=><div key={factor.label}><span>{factor.label}</span><div><i style={{width:`${factor.impact}%`}}/></div><strong>{factor.impact}%</strong></div>)}</div>;
}

export function HousingValuationGame({ finish }: { finish: (result: GameResult) => void }) {
  const [exampleIndex,setExampleIndex]=useState(0);
  const [started,setStarted]=useState(false);
  const [round,setRound]=useState(0);
  const [estimate,setEstimate]=useState(550);
  const [revealed,setRevealed]=useState(false);
  const [answers,setAnswers]=useState<Array<{estimate:number;model:number}>>([]);
  const example=housingExamples[exampleIndex];
  const house=housingRounds[round];

  const nextExample=()=>{if(exampleIndex<housingExamples.length-1)setExampleIndex(value=>value+1);else setStarted(true);};
  const evaluateRound=()=>setRevealed(true);
  const nextRound=()=>{const nextAnswers=[...answers,{estimate,model:house.modelValue}];if(round===housingRounds.length-1){const differences=nextAnswers.map(answer=>Math.abs(answer.estimate-answer.model));const average=Math.round(differences.reduce((sum,value)=>sum+value,0)/differences.length);const close=differences.filter(value=>value<=60).length;const score=clampScore(1000-average*2);finish({score,title:close>=4?"Tasador estratégico":"El modelo encontró diferencias",metrics:[["Rondas completadas","5/5"],["Estimaciones cercanas",`${close}/5`],["Diferencia promedio",`${average} unidades`],["Mejor aprendizaje","Combinar características"]],explanation:"La evaluación consideró las cinco viviendas. El modelo nunca usó una sola variable: combinó ubicación, superficie, transporte y conservación."});return;}setAnswers(nextAnswers);setRound(value=>value+1);setEstimate(550);setRevealed(false);};

  if(!started)return <section className="play-panel housing-tutorial"><div className="tutorial-heading"><div><small>EJEMPLO {exampleIndex+1} DE 3</small><h2>Aprende cómo piensa el modelo</h2><p>Antes de jugar, observa tres casos resueltos.</p></div><GraduationCap/></div><HouseProfile house={example}/><div className="example-result"><div><small>ESTIMACIÓN DEL MODELO</small><strong>{example.modelValue} unidades</strong></div><FactorBars house={example}/></div><button className="primary" type="button" onClick={nextExample}>{exampleIndex===2?"Empezar las 5 rondas":"Ver siguiente ejemplo"}<ArrowRight/></button></section>;

  const difference=Math.abs(estimate-house.modelValue);
  return <section className="play-panel housing-rounds"><div className="housing-round-header"><div><small>RONDA {round+1} DE 5</small><h2>{revealed?"Compara las estimaciones":"¿Cuánto cuesta esta vivienda?"}</h2></div><div className="round-pips">{housingRounds.map((_,index)=><span className={index<round?"complete":index===round?"active":""} key={index}/>)}</div></div><HouseProfile house={house}/>{!revealed?<><label className="housing-estimate">Tu estimación <strong>{estimate} unidades</strong><input type="range" min="300" max="900" step="10" value={estimate} onChange={event=>setEstimate(Number(event.target.value))}/><div><span>300</span><span>900</span></div></label><button className="primary" type="button" onClick={evaluateRound}>Confirmar estimación</button></>:<div className="housing-reveal"><div className="estimate-comparison"><div><small>TU ESTIMACIÓN</small><strong>{estimate}</strong></div><div className="comparison-arrow">↔</div><div><small>MODELO</small><strong>{house.modelValue}</strong></div></div><p className={difference<=60?"close":"far"}>{difference<=60?<><CheckCircle2/> ¡Muy cerca! Diferencia de {difference} unidades.</>:<><Sparkles/> Diferencia de {difference} unidades. Revisa qué variables pesaron más.</>}</p><FactorBars house={house}/><button className="primary" type="button" onClick={nextRound}>{round===4?"Ver evaluación final":"Siguiente vivienda"}<ArrowRight/></button></div>}</section>;
}
