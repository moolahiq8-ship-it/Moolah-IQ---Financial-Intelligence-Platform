import Hero from "@/components/Hero";
import StartHere from "@/components/StartHere";
import Videos from "@/components/Videos";
import IntelligenceBrief from "@/components/IntelligenceBrief";

export default function Home() {
  return (
    <>
      <Hero />

      <StartHere />

      {/*
       * Phase 4a insertion point — Money IQ quiz band (section id="quiz").
       * The hero's "Take the Money IQ quiz" CTA anchors to #quiz.
       */}

      <Videos />

      {/*
       * Phase 4b insertion point — Crossover Calculator band (section id="tool").
       * The hero's "Try the Crossover Calculator" link anchors to #tool.
       */}

      <IntelligenceBrief />
    </>
  );
}
