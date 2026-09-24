import Hero from "@/components/Hero";
import StartHere from "@/components/StartHere";
import MoneyIQQuiz from "@/components/MoneyIQQuiz";
import Videos from "@/components/Videos";
import CrossoverPreview from "@/components/CrossoverPreview";
import IntelligenceBrief from "@/components/IntelligenceBrief";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  // Titles and reading times for the quiz suggestions come from the articles themselves.
  const guides = Object.fromEntries(
    getAllPosts().map((p) => [p.slug, { title: p.title, readingTime: p.readingTime }])
  );
  return (
    <>
      <Hero />

      <StartHere />

      <MoneyIQQuiz guides={guides} />

      <Videos />

      <CrossoverPreview />

      <IntelligenceBrief />
    </>
  );
}
