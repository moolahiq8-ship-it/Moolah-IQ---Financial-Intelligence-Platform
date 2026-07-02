import Hero from "@/components/Hero";
import StartHere from "@/components/StartHere";
import MoneyIQQuiz from "@/components/MoneyIQQuiz";
import Videos from "@/components/Videos";
import IntelligenceBrief from "@/components/IntelligenceBrief";

export default function Home() {
  return (
    <>
      <Hero />

      <StartHere />

      <MoneyIQQuiz />

      <Videos />

      {/*
       * Phase 4b insertion point — Crossover Calculator band (section id="tool").
       * The hero's "Try the Crossover Calculator" link anchors to #tool.
       */}

      <IntelligenceBrief />
    </>
  );
}
