
import { GoogleGenAI } from "@google/genai";
import { Cluster } from "../types";

// Function to analyze a cluster using Gemini AI
export const analyzeCluster = async (cluster: Cluster): Promise<string> => {
  // Always create a new instance right before making an API call to ensure latest API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const names = cluster.communes.map(c => `${c.name} (${c.population} hab.)`).join(', ');
  const total = cluster.totalPopulation;

  const prompt = `
    Tu es un urbaniste expert du territoire français.
    J'ai créé un regroupement de communes composé de : 
    ${names}.
    
    Population totale: ${total}.
    
    1. Donne un nom créatif et réaliste à ce territoire (Ex: "Terres de l'Ill", "Porte du Sud", etc).
    2. Analyse brièvement la cohérence de ce groupe (ex: rural vs urbain).
    3. Suggère un service public prioritaire à mutualiser pour ces villes (ex: crèche, transport, déchetterie).

    Réponds en format texte court et structuré (Markdown). Sois concis.
  `;

  try {
    // Basic Text Task uses gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Access text property directly as per latest SDK guidelines
    return response.text || "Pas de réponse générée.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de l'analyse IA. Vérifiez la console.";
  }
};
