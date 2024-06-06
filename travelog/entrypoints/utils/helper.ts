import OpenAI from 'openai';
import { defineProxyService } from '@webext-core/proxy-service';
import { PageInfo, ParseReturn, Place } from '@/types/baseTypes';

class OpenAIService {
    client : any
    // apiKey : string
    constructor() {
        this.initialize()
    }

    async initialize(){
        try {
            const res = await browser.storage.local.get("openaikey");
            const apiKey = res.openaikey; // Assuming the key is "openaikey"
            if (typeof apiKey === 'string') { // Always good to check the type
              this.client = new OpenAI({ apiKey : apiKey, dangerouslyAllowBrowser: true});
            } else {
              throw new Error("API key is not a string");
            }
          } catch (error) {
            console.error("Failed to initialize OpenAI client:", error);
        }   
    }

    async startParsing(data?: string, source?: string, link?: string) : Promise< Place[] | undefined>{
        if (!data){
            return undefined
        }
        
        const scheme = "destinations: [{name: string, category?: string, address: string, startDate?: Date, endDate?: Date, description?: string, coordinates?: GeolocationCoordinates}]"
        const completion = await this.client.chat.completions.create({
            model:'gpt-3.5-turbo',
            messages: [{"role":"system","content":`You are an document parser that only responds using the api below\ndocument:${scheme}`},
                {"role":"user","content":`Return an array of json object representing travel destinations parsed from the document at the end of the prompt. \n${data}`}],
                max_tokens: 4096,
                response_format: { "type": "json_object" }
        })
        const res : ParseReturn = JSON.parse(completion.choices[0].message.content)
        res.destinations.map((dest) => {
            dest.category = dest.category ? dest.category : "place"
            dest.source = source,
            dest.link = link,
            dest.dateAccessed = new Date()
        })
        return res.destinations
    }
}

export const [parseToOpenAI] = defineProxyService('OpenAIService', () => new OpenAIService());