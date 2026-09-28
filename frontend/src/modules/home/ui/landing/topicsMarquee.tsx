import { cn } from "@/lib/utils";

const ROW_ONE = [
  "auth-bug-hunt", "pr-482-review", "friday-standup", "hotfix-2041", "design-crit",
  "hackathon-48h", "incident-db-lag", "pair-debug", "release-v2", "leetcode-night",
];
const ROW_TWO = [
  "api-contract", "flaky-tests", "infra-oncall", "onboarding-riya", "perf-budget",
  "k8s-migration", "retro-sprint-12", "css-is-hard", "rfc-caching", "demo-day",
];

function Row({ tags, reverse }: { tags: string[]; reverse?: boolean }) {
  // Items are rendered twice so the -50% translate loops seamlessly.
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className={cn("flex shrink-0 gap-3 pr-3", reverse ? "animate-marquee-reverse" : "animate-marquee")}>
        {[...tags, ...tags].map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            aria-hidden={i >= tags.length}
            className="whitespace-nowrap rounded-full border border-black/5 bg-white px-4 py-2 font-mono text-sm dark:border-white/10 dark:bg-[#141414]"
          >
            <span className="text-yellow-600 dark:text-yellow-300">#</span>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TopicsMarquee() {
  return (
    <section className="space-y-3 py-10" aria-label="Example rooms">
      <Row tags={ROW_ONE} />
      <Row tags={ROW_TWO} reverse />
    </section>
  );
}
