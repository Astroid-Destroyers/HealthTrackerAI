import { OpenAI } from "openai";
import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import bannerImage from './heathtracker banner.png';
// import { Image } from "@heroui/image";
import Image from "next/image";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const response = await client.responses.create({
//   model: "gpt-4o",
//   input:"Write a welcome message for HealthTrackerAI",
// });

// console.log(response.output_text);

export default function IndexPage() {
  
  return (
    <DefaultLayout>
      <div className="w-full flex justify-center items-center" style={{ backgroundColor: 'rgb(77, 77, 77)' }}>
        <Image
          alt="HealthTrackerAI Banner"
          src={bannerImage}
          width={800}
          height={200}
          className="rounded-lg"
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-xl text-center justify-center">
          Welcome to HealthTrackerAI
        </div>

        <div className="flex gap-3">
          <Link
            isExternal
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href={siteConfig.links.docs}
          >
            Documentation
          </Link>
          <Link
            isExternal
            className={buttonStyles({ variant: "bordered", radius: "full" })}
            href={siteConfig.links.github}
          >
            <GithubIcon size={20} />
            GitHub
          </Link>
        </div>

        <div className="mt-8">
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <span>
              Get started by editing{" "}
              <Code color="primary">pages/index.tsx</Code>
            </span>
          </Snippet>
        </div>
      </section>
    </DefaultLayout>
  );
}
