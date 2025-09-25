// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from "next";

import { openai } from "@/utils/openai";

//isJSON
function isJSON(str: string) {
  try {
    JSON.parse(str);

    return true;
  } catch (e) {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Get input from query string (?input=...)
    const input =
      typeof req.query.input === "string" ? req.query.input : undefined;

    console.log("Input:", input);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: input
            ? input
            : "what is 2+2?, output as json with keys input and output",
        },
      ],
    });

    //if response is json parse it else return message
    completion
      ? console.log(completion.choices[0].message)
      : res.status(500).json({ error: "No response from OpenAI" });
    const content = completion.choices[0].message?.content ?? "";

    if (completion.choices.length === 0) {
      // no choices returned
      return res.status(500).json({ error: "No choices returned from OpenAI" });
    } else if (completion.choices[0].message?.content === undefined) {
      // no content returned
      return res.status(500).json({ error: "No content returned from OpenAI" });
    } else if (!isJSON(content)) {
      // content is not json
      return res.status(200).json({
        aiMessage: completion.choices[0].message,
        response: { output: content },
      });
    } else {
      // content is json
      const aiMessage = completion.choices[0].message;
      const response = JSON.parse(aiMessage?.content || "{}");

      return res.status(200).json({ aiMessage, response });
    }

    const aiMessage = completion.choices[0].message;
    const response = JSON.parse(aiMessage?.content || "{}");

    res.status(200).json({ aiMessage });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
