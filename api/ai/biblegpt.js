// api/biblegpt.js

const axios = require("axios");

module.exports = {
  meta: {
    name: "BibleGPT",
    description: "AI-powered tool that delivers accurate Bible-based answers to user queries",
    author: "Jaybohol",
    version: "1.0.0",
    category: "ai",
    method: "GET",
    path: "/biblegpt?q="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          author: "Jaybohol",
          message: "Please provide a question",
          usage: "/biblegpt?q=im sad"
        });
      }
      
      // Get Bible-based response
      const answer = await getBibleResponse(q);
      
      res.json({
        success: true,
        author: "Jaybohol",
        result: {
          answer: answer
        }
      });
      
    } catch (error) {
      console.error("BibleGPT Error:", error.message);
      
      res.status(500).json({
        success: false,
        author: "Jaybohol",
        message: error.message || "Failed to get Bible response"
      });
    }
  }
};

// ============= BIBLE RESPONSE GENERATOR =============

async function getBibleResponse(question) {
  try {
    // System prompt for BibleGPT
    const systemPrompt = `You are BibleGPT, an AI-powered tool that delivers accurate Bible-based answers. 
Your responses must:
- Be based on the Bible
- Include relevant Bible verses with references
- Be warm, compassionate, and helpful
- Answer directly without extra formatting like ** or markdown
- Keep responses concise but meaningful`;
    
    // Call Pollinations AI
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(question)}`, {
      params: {
        model: "openai",
        temperature: 0.7,
        system: systemPrompt
      },
      timeout: 30000
    });
    
    let answer = response.data;
    
    // Clean up any markdown formatting
    answer = answer.replace(/\*\*/g, '');
    answer = answer.replace(/\*/g, '');
    answer = answer.replace(/\n\n/g, ' ');
    answer = answer.replace(/\n/g, ' ');
    answer = answer.replace(/\s+/g, ' ').trim();
    
    return answer;
    
  } catch (error) {
    console.error("Polo AI Error:", error.message);
    
    // Fallback responses
    return getFallbackResponse(question);
  }
}

function getFallbackResponse(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Malungkot ako / I'm lonely / sad
  if (lowerQuestion.includes("malungkot") || lowerQuestion.includes("lonely") || lowerQuestion.includes("sad") || lowerQuestion.includes("alone")) {
    return "Kaibigan, naiintindihan ko na malungkot ka ngayon, at gusto kong malaman mo na hindi ka nag-iisa sa damdaming iyon. Sa Biblia, sinasabi sa Salmo 147:3, \"Pinagagaling ng Panginoon ang mga nanghihina ang puso, at dinudugtungan ang kanilang mga sugatang damdamin.\" Ang Diyos ay nandiyan para paginhawahin ka at gabayan ka sa mga sandaling malungkot ka. Gusto mo ba na pag-usapan natin nang mas malalim ang dahilan ng iyong kalungkutan, o gusto mo bang marinig pa ang iba pang mga talata na makapagbibigay ng lakas at pag-asa sa iyong puso?";
  }
  
  // David and Goliath
  if (lowerQuestion.includes("david") && lowerQuestion.includes("goliath")) {
    return "Ang kwento ni David at Goliath ay matatagpuan sa 1 Samuel 17. Si David ay isang batang pastol na may matibay na pananampalataya sa Diyos. Hinarap niya ang higanteng si Goliath hindi gamit ang espada at sibat, kundi gamit ang kanyang tirador at limang makinis na bato. Sinabi ni David kay Goliath: \"Lumalaban ka sa akin gamit ang espada at sibat, ngunit ako ay lumalaban sa iyo sa pangalan ng Panginoong Makapangyarihan sa lahat\" (1 Samuel 17:45). Pinatay ni David si Goliath sa isang batong tinamaan sa noo. Ang aral nito: Hindi tinitignan ng Diyos ang ating laki o lakas—tinitingnan Niya ang ating pananampalataya. Anumang higante ang iyong kinakaharap ngayon, tandaan mo na kasama mo ang Diyos.";
  }
  
  // John 3:16
  if (lowerQuestion.includes("john 3:16")) {
    return "Ang Juan 3:16 ay isa sa pinakamamahal na talata sa Biblia: \"Sapagkat gayon na lamang ang pag-ibig ng Diyos sa sangkatauhan, kaya't ibinigay niya ang kanyang bugtong na Anak, upang ang sinumang sumampalataya sa kanya ay hindi mapahamak kundi magkaroon ng buhay na walang hanggan.\" Ipinapakita ng talatang ito ang puso ng Ebanghelyo—ang pag-ibig ng Diyos ay napakalawak, handa Siyang magbigay ng Kanyang Anak para sa atin, at ang sinumang sumasampalataya ay tatanggap ng buhay na walang hanggan. Ito ang magandang balita na kahit sino ka man, mahal ka ng Diyos at inaanyayahan ka sa isang relasyon sa Kanya.";
  }
  
  // Love
  if (lowerQuestion.includes("love") || lowerQuestion.includes("pag-ibig")) {
    return "Ang Biblia ay maraming sinasabi tungkol sa pag-ibig. Sa 1 Corinto 13:4-7, inilalarawan nito ang pag-ibig: \"Ang pag-ibig ay matiyaga at magandang-loob. Hindi ito nauinggit, hindi nagyayabang, hindi mapagmataas. Hindi ito bastos, hindi makasarili, hindi madaling magalit, at hindi nagtatanim ng sama ng loob. Hindi natutuwa ang pag-ibig sa masama kundi sa katotohanan. Ang pag-ibig ay laging nagtatanggol, laging nagtitiwala, laging umaasa, laging nagtitiyaga.\" At sa 1 Juan 4:8, sinasabi na \"Ang Diyos ay pag-ibig.\" Ang pag-ibig ay hindi lamang damdamin—ito ay pagkilos, pagpili, at higit sa lahat, ito ang katangian ng Diyos mismo.";
  }
  
  // Faith
  if (lowerQuestion.includes("faith") || lowerQuestion.includes("pananampalataya")) {
    return "Ang pananampalataya ay sentro sa buhay Kristiyano. Ang Hebreo 11:1 ay nagsasabing: \"Ang pananampalataya ay ang pagkakatiwala sa mga bagay na ating inaasahan, at ang katibayan ng mga bagay na hindi natin nakikita.\" Ito ay pagtitiwala sa Diyos kahit hindi natin nakikita ang resulta. Ang Efeso 2:8-9 ay nagpapaalala na tayo ay naligtas sa pamamagitan ng biyaya sa pananampalataya—ito ay kaloob ng Diyos, hindi bunga ng ating mga gawa. Lumalago ang pananampalataya sa pamamagitan ng pakikinig sa Salita ng Diyos (Roma 10:17) at sa pamamagitan ng mga pagsubok na nagpapalakas ng ating pagtitiwala sa Kanya.";
  }
  
  // Prayer
  if (lowerQuestion.includes("pray") || lowerQuestion.includes("dasal")) {
    return "Ang panalangin ay simpleng pakikipag-usap sa Diyos. Itinuro ni Jesus ang panalangin sa Mateo 6:9-13: \"Ama namin na nasa langit, sambahin ang pangalan mo. Dumating ang kaharian mo, sundin ang kalooban mo dito sa lupa gaya ng sa langit. Bigyan mo kami ng aming kakanin sa araw-araw. At patawarin mo kami sa aming mga kasalanan, gaya ng pagpapatawad namin sa mga nagkakasala sa amin. At huwag mo kaming hayaang matukso, kundi iligtas mo kami sa masama.\" Hinihikayat tayo ng Biblia na \"manalangin nang walang tigil\" (1 Tesalonica 5:17) at dalhin ang lahat sa Diyos sa panalangin na may pasasalamat (Filipos 4:6). Walang maling paraan sa pagdarasal—lumapit lang sa Diyos nang may tapat na puso.";
  }
  
  // Hope
  if (lowerQuestion.includes("hope") || lowerQuestion.includes("pag-asa")) {
    return "Ang pag-asa sa Biblia ay hindi basta paghiling lamang—ito ay tiwala sa mga pangako ng Diyos. Sinasabi sa Jeremias 29:11: \"Sapagkat ako lamang ang nakakaalam ng aking mga plano para sa inyo, mga planong hindi kayo pinsalain kundi palaguin, mga planong magbibigay sa inyo ng kinabukasan at pag-asa.\" Ang Roma 15:13 ay nagbibigay ng magandang basbas: \"Sumainyo nawa ang Diyos ng pag-asa at punuin niya kayo ng kagalakan at kapayapaan habang kayo'y sumasampalataya sa kanya, upang ang inyong pag-asa ay sumagana sa pamamagitan ng kapangyarihan ng Espiritu Santo.\" Kahit gaano man kahirap ang sitwasyon, ang pag-asa ay nagpapaalala na ang Diyos ay may magandang plano para sa atin.";
  }
  
  // Peace
  if (lowerQuestion.includes("peace") || lowerQuestion.includes("kapayapaan")) {
    return "Nag-aalok ang Diyos ng kapayapaan na higit sa ating pang-unawa. Sinabi ni Jesus sa Juan 14:27: \"Kapayapaan ang iniiwan ko sa inyo; ang aking kapayapaan ay ibinibigay ko sa inyo. Hindi ko ito ibinibigay tulad ng pagbibigay ng mundo. Huwag mabagabag ang inyong mga puso at huwag matakot.\" At sa Filipos 4:6-7: \"Huwag kayong mabalisa sa anumang bagay; sa halip, sa lahat ng bagay, sa pamamagitan ng panalangin at pagsusumamo na may pasasalamat, ipaalam ninyo sa Diyos ang inyong mga kahilingan. At ang kapayapaan ng Diyos, na higit sa lahat ng pang-unawa, ang siyang magbabantay sa inyong mga puso at pag-iisip kay Cristo Jesus.\" Ang kapayapaang ito ay hindi nakadepende sa sitwasyon—ito ay nagmumula sa pagtitiwala na ang Diyos ay may kontrol at nagmamalasakit sa atin.";
  }
  
  // Default response
  return "Salamat sa iyong tanong. Ang Biblia ay may karunungan para sa bawat aspeto ng buhay. Upang mabigyan kita ng pinaka-angkop na sagot, maaari kang magtanong tungkol sa isang partikular na talata (gaya ng 'Juan 3:16'), isang tema sa Biblia (gaya ng 'pag-ibig' o 'pananampalataya'), o isang kuwento sa Biblia (gaya ng 'David at Goliath'). Gaya ng sinasabi sa 2 Timoteo 3:16-17, 'Ang buong Kasulatan ay hiningahan ng Diyos at mapapakinabangan sa pagtuturo, sa pagsaway, sa pagtutuwid, at sa pagsasanay sa katuwiran, upang ang lingkod ng Diyos ay maging ganap na handa sa bawat mabuting gawain.' Ano ang nais mong malaman tungkol sa Salita ng Diyos?";
}
