import OpenAI from "openai";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const openai = new OpenAI();
const speechFile = path.resolve("./speech.mp3");

export async function POST(req) {
    try {
        const { model, voice, input } = await req.json();

        const mp3 = await openai.audio.speech.create({
            model: model,
            voice: voice,
            input: input,
          });

          const buffer = Buffer.from(await mp3.arrayBuffer());
          await fs.promises.writeFile(speechFile, buffer); //Where is the mp3 file saved?
          //It is saved in the root directory of the project
          //But how do I get it to the client?
          //I need to return the file as a response
          return NextResponse.json({ speechFile });

        
    } catch (error) {
        console.error('OpenAI API error:', error);
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
}