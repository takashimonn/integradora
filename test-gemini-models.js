require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY no está configurada');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelos = ['gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash'];

  console.log('Probando modelos de Gemini...\n');

  for (const modeloNombre of modelos) {
    try {
      console.log(`Probando: ${modeloNombre}...`);
      const model = genAI.getGenerativeModel({ model: modeloNombre });
      const result = await model.generateContent('Responde solo con "OK"');
      const response = await result.response;
      const texto = response.text();
      console.log(`✅ ${modeloNombre} FUNCIONA! Respuesta: ${texto}\n`);
      return modeloNombre; // Retornar el primer que funcione
    } catch (error) {
      console.log(`❌ ${modeloNombre} NO funciona: ${error.message}\n`);
    }
  }

  console.log('Ningún modelo funcionó. Verifica tu API key.');
}

testModels().catch(console.error);

