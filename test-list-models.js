require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY no está configurada');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Intentar listar modelos disponibles
    console.log('Listando modelos disponibles...\n');
    
    // La librería no tiene método directo para listar, pero podemos probar con la API REST
    const fetch = require('node-fetch');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log('Modelos disponibles:');
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName || 'Sin nombre'})`);
      });
      
      // Probar con el primer modelo disponible
      if (data.models.length > 0) {
        const primerModelo = data.models[0].name.replace('models/', '');
        console.log(`\nProbando con: ${primerModelo}...`);
        const model = genAI.getGenerativeModel({ model: primerModelo });
        const result = await model.generateContent('Responde solo con "OK"');
        const response2 = await result.response;
        console.log(`✅ FUNCIONA! Usa este modelo: ${primerModelo}`);
        console.log(`Respuesta: ${response2.text()}`);
      }
    } else {
      console.log('Error al listar modelos:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
    // Intentar con modelos conocidos usando v1 en lugar de v1beta
    console.log('\nIntentando con modelos usando API v1...');
  }
}

listModels().catch(console.error);

