import { Configuration, OpenAIApi } from 'openai';

const dalle_styles = {
  "normal": {
      "instruction": ""
  },
  "stereotypical": {
      "instruction": "Create an image that represents a stereotypical depiction of "
  },
  "diverse": {
      "instruction": "Create an image that represents a culturally diverse and inclusive interpretation of "
  }
};


export const dalle = async (prompt, key, style = 'normal') => {
  const configuration = new Configuration({
    apiKey: key,
  });

  const openai = new OpenAIApi(configuration);
  
  // Get the instruction based on the style
  const instruction = dalle_styles[style]?.instruction || '';

  // Add the instruction to the prompt
  const fullPrompt = `${instruction}${prompt}`;

  const response = await openai.createImage({
    prompt: fullPrompt,
    n: 1,
    // size: '512x512',
    size: '256x256',
  });

  return response;
};