import dotenv from 'dotenv';
import OpenAI from 'openai';
import { defineProxyService } from '@webext-core/proxy-service';

function OpenAIService() {
   
    return {
        async startParsing(data : string){
            dotenv.config()
            const OPENAI_KEY = process.env.OPENAI_SECRET_KEY;   
            const scheme = "{name: string, place_type?: string, address: string, startDate?: Date, endDate?: Date, description?: string, coordinates?: GeolocationCoordinates}"
            const client = new OpenAI();
            client.apiKey = OPENAI_KEY!;
            const completion = await client.chat.completions.create({
              model:'gpt-3.5-turbo',
              messages: [{"role":"system","content":`You are an html document parser that only responds using the api below\nhtml_document:${scheme}`},
            {"role":"user","content":`Return a json object parsed from the html document for a travel itinerary at the end of the prompt.\n${data}`}]
            })
        
            const res = completion.choices[0].message.content
            console.log(res)
            return res;
        },
    }
}


export const [startOpenAI] = defineProxyService('OpenAIService', OpenAIService);