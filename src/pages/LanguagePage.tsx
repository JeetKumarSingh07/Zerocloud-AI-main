import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Mic, Volume2, CheckCircle, XCircle,
  RefreshCw, Star, ChevronRight, ChevronLeft,
  Trophy, Zap, AlertCircle, BookOpen, Brain, Play
} from 'lucide-react'

interface Lesson { phrase: string; translation: string; pronunciation: string; tip: string; example?: string }

const LANGUAGES = [
  { code:'ES', name:'Spanish',    flag:'🇪🇸', bcp47:'es-ES' },
  { code:'FR', name:'French',     flag:'🇫🇷', bcp47:'fr-FR' },
  { code:'DE', name:'German',     flag:'🇩🇪', bcp47:'de-DE' },
  { code:'JP', name:'Japanese',   flag:'🇯🇵', bcp47:'ja-JP' },
  { code:'IN', name:'Hindi',      flag:'🇮🇳', bcp47:'hi-IN' },
  { code:'CN', name:'Chinese',    flag:'🇨🇳', bcp47:'zh-CN' },
  { code:'BR', name:'Portuguese', flag:'🇧🇷', bcp47:'pt-BR' },
  { code:'IT', name:'Italian',    flag:'🇮🇹', bcp47:'it-IT' },
]

const TOPICS = ['Greetings','Food & Dining','Travel','Numbers','Shopping','Emergencies','Business','Small Talk']

// Complete curated lessons for all languages
const LESSONS: Record<string, Record<string, Lesson[]>> = {
  ES: {
    'Greetings': [
      { phrase:'Hola', translation:'Hello', pronunciation:'OH-la', tip:'Used any time of day', example:'¡Hola! ¿Cómo estás? — Hello! How are you?' },
      { phrase:'Buenos días', translation:'Good morning', pronunciation:'BWEH-nos DEE-as', tip:'Used until noon', example:'Buenos días, señor. — Good morning, sir.' },
      { phrase:'¿Cómo estás?', translation:'How are you?', pronunciation:'KOH-mo eh-STAHS', tip:'Informal. Use "está usted" formally', example:'¡Bien, gracias! ¿Y tú? — Fine, thanks! And you?' },
      { phrase:'Mucho gusto', translation:'Nice to meet you', pronunciation:'MOO-cho GOOS-to', tip:'Said when first meeting someone', example:'Mucho gusto, me llamo Ana. — Nice to meet you, I\'m Ana.' },
      { phrase:'Hasta luego', translation:'Goodbye / See you later', pronunciation:'AH-sta LWEH-go', tip:'Common farewell', example:'Hasta luego, amigo! — See you later, friend!' },
    ],
    'Food & Dining': [
      { phrase:'Una mesa para dos', translation:'A table for two', pronunciation:'OO-na MEH-sa PAH-ra dos', tip:'Say this when entering a restaurant', example:'¿Tiene una mesa para dos? — Do you have a table for two?' },
      { phrase:'La cuenta, por favor', translation:'The bill, please', pronunciation:'la KWEN-ta por fa-VOR', tip:'Essential dining phrase', example:'¿Nos trae la cuenta? — Could you bring us the bill?' },
      { phrase:'Está delicioso', translation:'It\'s delicious', pronunciation:'eh-STAH deh-lee-SYOH-so', tip:'Compliment the chef!', example:'¡Todo está delicioso! — Everything is delicious!' },
      { phrase:'Tengo alergia a...', translation:'I am allergic to...', pronunciation:'TEN-go ah-LER-hya ah', tip:'Critical for food allergies', example:'Tengo alergia a los frutos secos. — I\'m allergic to nuts.' },
      { phrase:'¿Qué recomienda?', translation:'What do you recommend?', pronunciation:'keh reh-ko-MYEN-da', tip:'Ask the waiter for suggestions', example:'¿Qué plato recomienda hoy? — What dish do you recommend today?' },
    ],
    'Travel': [
      { phrase:'¿Dónde está...?', translation:'Where is...?', pronunciation:'DON-deh eh-STAH', tip:'Most useful travel phrase', example:'¿Dónde está el baño? — Where is the bathroom?' },
      { phrase:'¿Cuánto cuesta?', translation:'How much does it cost?', pronunciation:'KWAN-to KWES-ta', tip:'Ask for prices', example:'¿Cuánto cuesta el billete? — How much is the ticket?' },
      { phrase:'Necesito ayuda', translation:'I need help', pronunciation:'neh-seh-SEE-to ah-YOO-da', tip:'Emergency phrase', example:'Necesito ayuda, por favor. — I need help, please.' },
      { phrase:'No entiendo', translation:'I don\'t understand', pronunciation:'no en-TYEN-do', tip:'Ask them to slow down', example:'No entiendo. ¿Puede repetir? — I don\'t understand. Can you repeat?' },
      { phrase:'Habla más despacio', translation:'Please speak more slowly', pronunciation:'AH-bla mas des-PAH-syo', tip:'Ask anyone to slow down', example:'Por favor, habla más despacio. — Please speak more slowly.' },
    ],
    'Numbers': [
      { phrase:'Uno, dos, tres', translation:'One, two, three', pronunciation:'OO-no, dos, tres', tip:'Count on fingers!', example:'Dame tres, por favor. — Give me three, please.' },
      { phrase:'Cuatro, cinco, seis', translation:'Four, five, six', pronunciation:'KWA-tro, SIN-ko, seis', tip:'"Seis" rhymes with "ace"', example:'Necesito cinco minutos. — I need five minutes.' },
      { phrase:'Siete, ocho, nueve, diez', translation:'Seven, eight, nine, ten', pronunciation:'SYET-eh, OH-cho, NWEH-veh, dyez', tip:'Complete your basic count', example:'Diez euros, por favor. — Ten euros, please.' },
      { phrase:'Cien / Mil', translation:'Hundred / Thousand', pronunciation:'syen / meel', tip:'Ciento for 101-199', example:'Cien personas. — A hundred people.' },
      { phrase:'¿Qué número?', translation:'What number?', pronunciation:'keh NOO-meh-ro', tip:'Ask for addresses, phones etc', example:'¿Qué número de teléfono? — What phone number?' },
    ],
    'Shopping': [
      { phrase:'¿Tiene talla...?', translation:'Do you have size...?', pronunciation:'TYEH-neh TAH-ya', tip:'Follow with S, M, L or number', example:'¿Tiene en talla mediana? — Do you have it in medium?' },
      { phrase:'Es demasiado caro', translation:'It\'s too expensive', pronunciation:'es deh-ma-SYA-do KA-ro', tip:'For bargaining', example:'Es demasiado caro. ¿Tiene algo más barato? — Too expensive. Anything cheaper?' },
      { phrase:'¿Dónde están los probadores?', translation:'Where are the fitting rooms?', pronunciation:'DON-deh es-TAN los pro-ba-DOR-es', tip:'Essential for clothing stores', example:'¿Puedo probármelo? — Can I try it on?' },
      { phrase:'Lo compro', translation:'I\'ll buy it', pronunciation:'lo KOM-pro', tip:'Confirm your purchase', example:'Me lo llevo. — I\'ll take it.' },
      { phrase:'¿Acepta tarjeta?', translation:'Do you accept cards?', pronunciation:'ah-SEP-ta tar-HEH-ta', tip:'Check before shopping', example:'¿Acepta tarjeta de crédito? — Do you accept credit cards?' },
    ],
    'Emergencies': [
      { phrase:'¡Socorro!', translation:'Help!', pronunciation:'so-KOR-ro', tip:'Shout loudly', example:'¡Socorro, llame a la policía! — Help, call the police!' },
      { phrase:'Llame a la policía', translation:'Call the police', pronunciation:'YA-meh a la po-li-SEE-a', tip:'Emergency: 112 in Spain', example:'¡Llame a la policía, por favor! — Call the police, please!' },
      { phrase:'Necesito un médico', translation:'I need a doctor', pronunciation:'neh-seh-SEE-to un MEH-dee-ko', tip:'Medical emergency', example:'Es urgente, necesito un médico. — It\'s urgent, I need a doctor.' },
      { phrase:'Me han robado', translation:'I have been robbed', pronunciation:'meh an ro-BA-do', tip:'Report to police', example:'Me han robado la cartera. — My wallet was stolen.' },
      { phrase:'¿Hay un hospital cerca?', translation:'Is there a hospital nearby?', pronunciation:'ay un os-pee-TAL SER-ka', tip:'Get directions quickly', example:'¿Dónde está el hospital más cercano? — Where is the nearest hospital?' },
    ],
    'Business': [
      { phrase:'Tengo una cita', translation:'I have an appointment', pronunciation:'TEN-go OO-na SEE-ta', tip:'For meetings', example:'Tengo una cita a las tres. — I have an appointment at three.' },
      { phrase:'¿Podemos hablar de negocios?', translation:'Can we talk business?', pronunciation:'po-DEH-mos ah-BLAR deh neh-GO-syos', tip:'Opening business discussions', example:'Me gustaría hablar de una posible colaboración. — I\'d like to discuss a possible collaboration.' },
      { phrase:'¿Cuáles son sus condiciones?', translation:'What are your terms?', pronunciation:'KWA-les son sus kon-dee-SYO-nes', tip:'Negotiation phrase', example:'¿Cuáles son las condiciones de pago? — What are the payment terms?' },
      { phrase:'Firme aquí, por favor', translation:'Please sign here', pronunciation:'FEER-meh ah-KEE', tip:'Contract signing', example:'Necesita firmar aquí. — You need to sign here.' },
      { phrase:'Quedo a su disposición', translation:'I am at your disposal', pronunciation:'KEH-do a su dis-po-si-SYON', tip:'Professional closing', example:'Quedo a su disposición para cualquier duda. — I\'m available for any questions.' },
    ],
    'Small Talk': [
      { phrase:'¿De dónde eres?', translation:'Where are you from?', pronunciation:'deh DON-deh EH-res', tip:'Start a conversation', example:'Soy de Inglaterra. ¿Y tú? — I\'m from England. And you?' },
      { phrase:'Me gusta mucho...', translation:'I really like...', pronunciation:'meh GOOS-ta MOO-cho', tip:'Express preferences', example:'Me gusta mucho la comida española. — I really like Spanish food.' },
      { phrase:'¿Qué tiempo hace?', translation:'What\'s the weather like?', pronunciation:'keh TYEM-po AH-seh', tip:'Classic conversation opener', example:'Hoy hace mucho calor. — It\'s very hot today.' },
      { phrase:'¿Tienes familia?', translation:'Do you have family?', pronunciation:'TYEH-nes fa-MI-lya', tip:'Get personal', example:'Tengo dos hermanos. — I have two siblings.' },
      { phrase:'¡Qué interesante!', translation:'How interesting!', pronunciation:'keh een-teh-reh-SAN-teh', tip:'Show engagement', example:'¡Qué interesante tu trabajo! — How interesting your job is!' },
    ],
  },
  FR: {
    'Greetings': [
      { phrase:'Bonjour', translation:'Hello / Good day', pronunciation:'bohn-ZHOOR', tip:'Safe any time of day', example:'Bonjour, comment allez-vous? — Hello, how are you?' },
      { phrase:'Bonsoir', translation:'Good evening', pronunciation:'bohn-SWAHR', tip:'Use after 6pm', example:'Bonsoir madame! — Good evening, ma\'am!' },
      { phrase:'Comment allez-vous?', translation:'How are you? (formal)', pronunciation:'koh-MAHN tah-lay-VOO', tip:'Use "tu vas?" informally', example:'Très bien, merci! — Very well, thank you!' },
      { phrase:'Enchanté(e)', translation:'Pleased to meet you', pronunciation:'ahn-shahn-TAY', tip:'Add -e for feminine', example:'Enchanté, je m\'appelle Pierre. — Pleased to meet you, I\'m Pierre.' },
      { phrase:'Au revoir', translation:'Goodbye', pronunciation:'oh reh-VWAHR', tip:'Formal goodbye', example:'Au revoir, à bientôt! — Goodbye, see you soon!' },
    ],
    'Food & Dining': [
      { phrase:'Une table pour deux', translation:'A table for two', pronunciation:'oon TAH-bluh poor duh', tip:'Booking a restaurant', example:'Avez-vous une table pour deux? — Do you have a table for two?' },
      { phrase:'L\'addition, s\'il vous plaît', translation:'The bill, please', pronunciation:'lah-dee-SYOHN seel voo PLAY', tip:'Essential dining phrase', example:'Apportez-nous l\'addition. — Bring us the bill.' },
      { phrase:'C\'est délicieux!', translation:'It\'s delicious!', pronunciation:'say day-lee-SYUH', tip:'Compliment the food', example:'Tout est délicieux! — Everything is delicious!' },
      { phrase:'Je suis allergique à...', translation:'I am allergic to...', pronunciation:'zhuh SWEE ah-lair-ZHEEK ah', tip:'Food allergy warning', example:'Je suis allergique aux arachides. — I\'m allergic to peanuts.' },
      { phrase:'Qu\'est-ce que vous recommandez?', translation:'What do you recommend?', pronunciation:'kes kuh voo ruh-koh-mahn-DAY', tip:'Ask the waiter', example:'Qu\'est-ce que vous recommandez aujourd\'hui? — What do you recommend today?' },
    ],
    'Travel': [
      { phrase:'Où se trouve...?', translation:'Where is...?', pronunciation:'oo suh TROOV', tip:'Most useful direction phrase', example:'Où se trouve la gare? — Where is the train station?' },
      { phrase:'Combien ça coûte?', translation:'How much does it cost?', pronunciation:'kohm-BYAHN sah KOOT', tip:'Ask prices', example:'Combien ça coûte le billet? — How much is the ticket?' },
      { phrase:'J\'ai besoin d\'aide', translation:'I need help', pronunciation:'zhay buh-ZWAHN ded', tip:'Emergency phrase', example:'J\'ai besoin d\'aide, s\'il vous plaît. — I need help, please.' },
      { phrase:'Je ne comprends pas', translation:'I don\'t understand', pronunciation:'zhuh nuh kohm-PRAHN pah', tip:'Ask for clarification', example:'Pouvez-vous répéter? — Can you repeat?' },
      { phrase:'Parlez plus lentement', translation:'Speak more slowly', pronunciation:'par-LAY ploo lahnt-MAHN', tip:'Ask to slow down', example:'S\'il vous plaît, plus lentement. — Please, more slowly.' },
    ],
  },
  DE: {
    'Greetings': [
      { phrase:'Guten Morgen!', translation:'Good morning!', pronunciation:'GOO-ten MOR-gen', tip:'Until about 10am', example:'Guten Morgen! Wie geht es Ihnen? — Good morning! How are you?' },
      { phrase:'Wie geht es Ihnen?', translation:'How are you? (formal)', pronunciation:'vee GAYT es EE-nen', tip:'"Wie geht\'s?" for informal', example:'Danke, gut! — Thanks, fine!' },
      { phrase:'Freut mich!', translation:'Nice to meet you!', pronunciation:'froyt mikh', tip:'Short for "Es freut mich"', example:'Freut mich, Sie kennenzulernen. — Nice to meet you.' },
      { phrase:'Auf Wiedersehen', translation:'Goodbye', pronunciation:'owf VEE-der-zay-en', tip:'Formal farewell', example:'Auf Wiedersehen, bis morgen! — Goodbye, see you tomorrow!' },
      { phrase:'Tschüss!', translation:'Bye! (informal)', pronunciation:'chüss', tip:'Casual farewell between friends', example:'Tschüss, bis bald! — Bye, see you soon!' },
    ],
    'Food & Dining': [
      { phrase:'Einen Tisch für zwei', translation:'A table for two', pronunciation:'EYE-nen tish führ tsvai', tip:'Restaurant reservation phrase', example:'Haben Sie einen Tisch frei? — Do you have a table available?' },
      { phrase:'Die Rechnung, bitte', translation:'The bill, please', pronunciation:'dee REKH-nung BIT-eh', tip:'Ask for the check', example:'Könnten Sie mir die Rechnung bringen? — Could you bring me the bill?' },
      { phrase:'Das schmeckt sehr gut!', translation:'This tastes very good!', pronunciation:'das shhmekt zayr goot', tip:'Compliment food', example:'Alles ist sehr lecker! — Everything is very tasty!' },
      { phrase:'Ich bin allergisch gegen...', translation:'I am allergic to...', pronunciation:'ikh bin ah-LAIR-gish GAY-gen', tip:'Critical safety phrase', example:'Ich bin allergisch gegen Nüsse. — I\'m allergic to nuts.' },
      { phrase:'Was empfehlen Sie?', translation:'What do you recommend?', pronunciation:'vas em-PFAY-len zee', tip:'Ask the waiter', example:'Was empfehlen Sie heute? — What do you recommend today?' },
    ],
  },
  IN: {
    'Greetings': [
      { phrase:'नमस्ते', translation:'Hello / Goodbye', pronunciation:'na-mas-tay', tip:'Works for both hello and goodbye. Pair with folded hands 🙏', example:'नमस्ते! आप कैसे हैं? — Hello! How are you?' },
      { phrase:'आप कैसे हैं?', translation:'How are you? (formal)', pronunciation:'aap kai-say hain', tip:'Use "aap" for respect. Informal: "tum kaise ho?"', example:'मैं ठीक हूँ, धन्यवाद। — I am fine, thank you.' },
      { phrase:'मेरा नाम ___ है', translation:'My name is ___', pronunciation:'may-raa naam ___ hai', tip:'Fill in your name', example:'मेरा नाम Raj है। — My name is Raj.' },
      { phrase:'धन्यवाद', translation:'Thank you', pronunciation:'dhun-ya-vaad', tip:'"Shukriya" is also used (Urdu influence)', example:'आपकी मदद के लिए धन्यवाद। — Thank you for your help.' },
      { phrase:'फिर मिलेंगे', translation:'See you again', pronunciation:'phir mi-len-gay', tip:'Friendly farewell', example:'कल फिर मिलेंगे। — See you again tomorrow.' },
    ],
    'Food & Dining': [
      { phrase:'मुझे भूख लगी है', translation:'I am hungry', pronunciation:'mu-jhay bhookh la-gee hai', tip:'Literally "hunger has attached to me"', example:'मुझे बहुत भूख लगी है। — I am very hungry.' },
      { phrase:'यह बहुत स्वादिष्ट है', translation:'This is very delicious', pronunciation:'yah ba-hut swa-dish-t hai', tip:'Compliment the cook!', example:'खाना बहुत स्वादिष्ट था। — The food was very delicious.' },
      { phrase:'बिल लाइए', translation:'Please bring the bill', pronunciation:'bill laa-i-ay', tip:'Polite way to ask for the check', example:'भाई, बिल लाइए। — Excuse me, bring the bill.' },
      { phrase:'क्या शाकाहारी खाना है?', translation:'Is there vegetarian food?', pronunciation:'kya sha-kaa-haa-ree khaa-naa hai', tip:'Essential for vegetarians in India', example:'मुझे शाकाहारी खाना चाहिए। — I need vegetarian food.' },
      { phrase:'और चाहिए', translation:'I want more', pronunciation:'aur chaa-hi-ay', tip:'Ask for second helping', example:'चावल और चाहिए। — I want more rice.' },
    ],
    'Travel': [
      { phrase:'यह कहाँ है?', translation:'Where is this?', pronunciation:'yah ka-haan hai', tip:'Point to a map while asking', example:'रेलवे स्टेशन कहाँ है? — Where is the railway station?' },
      { phrase:'कितना किराया है?', translation:'How much is the fare?', pronunciation:'kit-naa ki-raa-yaa hai', tip:'Ask in auto-rickshaws and taxis', example:'दिल्ली तक कितना किराया है? — How much is the fare to Delhi?' },
      { phrase:'रुकिए!', translation:'Stop! / Wait!', pronunciation:'ru-ki-ay', tip:'To stop a taxi or bus', example:'यहाँ रुकिए! — Stop here!' },
      { phrase:'मुझे ___ जाना है', translation:'I need to go to ___', pronunciation:'mu-jhay ___ jaa-naa hai', tip:'Fill in the destination', example:'मुझे मुंबई जाना है। — I need to go to Mumbai.' },
      { phrase:'नजदीकी होटल कहाँ है?', translation:'Where is the nearest hotel?', pronunciation:'naz-dee-kee ho-tel ka-haan hai', tip:'For last-minute accommodation', example:'कोई अच्छा होटल है यहाँ? — Is there a good hotel here?' },
    ],
    'Shopping': [
      { phrase:'यह कितने का है?', translation:'How much does this cost?', pronunciation:'yah kit-nay kaa hai', tip:'The most useful shopping phrase', example:'यह कमीज कितने की है? — How much is this shirt?' },
      { phrase:'थोड़ा कम करो', translation:'Reduce the price a little', pronunciation:'tho-daa kam ka-ro', tip:'For bargaining — be friendly!', example:'यार, थोड़ा कम करो। — Friend, reduce it a little.' },
      { phrase:'बहुत महंगा है', translation:'This is very expensive', pronunciation:'ba-hut ma-han-gaa hai', tip:'Use while bargaining', example:'इतना महंगा? — This expensive?' },
      { phrase:'मुझे यह चाहिए', translation:'I want this one', pronunciation:'mu-jhay yah chaa-hi-ay', tip:'Point at the item', example:'मुझे यह वाला चाहिए। — I want this one.' },
      { phrase:'पक्का दाम क्या है?', translation:'What is the final price?', pronunciation:'pak-kaa daam kya hai', tip:'Ask for best price', example:'Last price क्या है? — What\'s your last price?' },
    ],
    'Emergencies': [
      { phrase:'मदद करो!', translation:'Help!', pronunciation:'ma-dad ka-ro', tip:'Shout loudly. Emergency: 112', example:'मदद करो! मदद करो! — Help! Help!' },
      { phrase:'पुलिस बुलाओ', translation:'Call the police', pronunciation:'pu-lees bu-laa-o', tip:'Police: 100', example:'पुलिस बुलाओ, जल्दी! — Call the police, quickly!' },
      { phrase:'मुझे डॉक्टर चाहिए', translation:'I need a doctor', pronunciation:'mu-jhay dok-tar chaa-hi-ay', tip:'Ambulance: 108', example:'मुझे तुरंत डॉक्टर चाहिए। — I need a doctor immediately.' },
      { phrase:'मुझे चोट लगी है', translation:'I am hurt / injured', pronunciation:'mu-jhay chot la-gee hai', tip:'Explain your injury', example:'मेरे पैर में चोट लगी है। — I have an injury on my leg.' },
      { phrase:'अस्पताल कहाँ है?', translation:'Where is the hospital?', pronunciation:'as-pa-taal ka-haan hai', tip:'Ask locals', example:'नजदीकी अस्पताल कहाँ है? — Where is the nearest hospital?' },
    ],
    'Numbers': [
      { phrase:'एक, दो, तीन', translation:'One, two, three', pronunciation:'ek, do, teen', tip:'Count on fingers!', example:'तीन कप चाय। — Three cups of tea.' },
      { phrase:'चार, पाँच, छह', translation:'Four, five, six', pronunciation:'chaar, paanch, chha', tip:'"Chha" has an aspirated h', example:'पाँच मिनट रुकिए। — Wait five minutes.' },
      { phrase:'सात, आठ, नौ, दस', translation:'Seven, eight, nine, ten', pronunciation:'saat, aath, nau, das', tip:'"Nau" sounds like "now"', example:'दस रुपये। — Ten rupees.' },
      { phrase:'बीस / पचास / सौ', translation:'Twenty / Fifty / Hundred', pronunciation:'bees / pa-chaas / sau', tip:'Common amounts for shopping', example:'सौ रुपये दीजिए। — Give me a hundred rupees.' },
      { phrase:'हजार / लाख', translation:'Thousand / Hundred-thousand', pronunciation:'ha-zaar / laakh', tip:'India uses lakh, not million', example:'दो लाख रुपये। — Two hundred thousand rupees.' },
    ],
  },
  JP: {
    'Greetings': [
      { phrase:'こんにちは (Konnichiwa)', translation:'Hello / Good afternoon', pronunciation:'kon-nee-chee-wa', tip:'Used from late morning to evening', example:'こんにちは！お元気ですか？— Hello! How are you?' },
      { phrase:'おはようございます (Ohayō gozaimasu)', translation:'Good morning', pronunciation:'oh-ha-yoh go-zai-mas', tip:'Very polite. "Ohayō" for casual', example:'おはようございます！— Good morning!' },
      { phrase:'ありがとう (Arigatō)', translation:'Thank you', pronunciation:'ah-ri-ga-toh', tip:'"Arigatō gozaimasu" is more polite', example:'どうもありがとう！— Thank you very much!' },
      { phrase:'すみません (Sumimasen)', translation:'Excuse me / I\'m sorry', pronunciation:'su-mi-ma-sen', tip:'For getting attention or apologizing', example:'すみません、駅はどこですか？— Excuse me, where is the station?' },
      { phrase:'さようなら (Sayōnara)', translation:'Goodbye (formal)', pronunciation:'sa-yoh-na-ra', tip:'"Ja ne" for casual farewell', example:'さようなら、またね！— Goodbye, see you!' },
    ],
    'Food & Dining': [
      { phrase:'いただきます (Itadakimasu)', translation:'Let\'s eat (before eating)', pronunciation:'i-ta-da-ki-mas', tip:'Always say before eating in Japan', example:'さあ、いただきます！— Well then, let\'s eat!' },
      { phrase:'おいしい！(Oishii!)', translation:'Delicious!', pronunciation:'oh-ee-shee', tip:'Biggest compliment to a cook', example:'これはとてもおいしい！— This is very delicious!' },
      { phrase:'メニューをください (Menyū wo kudasai)', translation:'Please give me the menu', pronunciation:'me-nyoo wo ku-da-sai', tip:'Ask for the menu politely', example:'メニューを一枚ください。— One menu please.' },
      { phrase:'ベジタリアンですか？(Bejitarian desu ka?)', translation:'Is it vegetarian?', pronunciation:'be-ji-ta-ri-an des ka', tip:'Vegetarian options exist but are limited', example:'肉なしでできますか？— Can it be made without meat?' },
      { phrase:'おかわりください (Okawari kudasai)', translation:'Refill please', pronunciation:'o-ka-wa-ri ku-da-sai', tip:'Ask for more rice/drink', example:'ごはんのおかわりください。— Rice refill please.' },
    ],
  },
  IT: {
    'Greetings': [
      { phrase:'Ciao!', translation:'Hi! / Bye! (casual)', pronunciation:'chow', tip:'Used for both hello and goodbye informally', example:'Ciao! Come stai? — Hi! How are you?' },
      { phrase:'Buongiorno', translation:'Good morning / Good day', pronunciation:'bwohn-JOR-no', tip:'Use until afternoon', example:'Buongiorno, signore! — Good morning, sir!' },
      { phrase:'Come stai?', translation:'How are you? (informal)', pronunciation:'KOH-meh STAI', tip:'"Come sta?" is formal', example:'Bene grazie, e tu? — Fine thanks, and you?' },
      { phrase:'Piacere!', translation:'Nice to meet you!', pronunciation:'pya-CHEH-reh', tip:'Short for "Piacere di conoscerti"', example:'Piacere di conoscerti! — Nice to meet you!' },
      { phrase:'Arrivederci', translation:'Goodbye (formal)', pronunciation:'ah-ree-veh-DAIR-chee', tip:'"Ciao" for casual goodbye', example:'Arrivederci, a presto! — Goodbye, see you soon!' },
    ],
  },
  CN: {
    'Greetings': [
      { phrase:'你好 (Nǐ hǎo)', translation:'Hello', pronunciation:'nee how', tip:'Most common greeting', example:'你好！你叫什么名字？— Hello! What\'s your name?' },
      { phrase:'早上好 (Zǎoshang hǎo)', translation:'Good morning', pronunciation:'dzao-shang how', tip:'Used in the morning', example:'早上好！— Good morning!' },
      { phrase:'谢谢 (Xièxiè)', translation:'Thank you', pronunciation:'syeh-syeh', tip:'Repeat twice for emphasis', example:'非常感谢！— Thank you very much!' },
      { phrase:'对不起 (Duìbuqǐ)', translation:'I\'m sorry / Excuse me', pronunciation:'dway-boo-chee', tip:'Both apology and excuse me', example:'对不起，我不明白。— I\'m sorry, I don\'t understand.' },
      { phrase:'再见 (Zàijiàn)', translation:'Goodbye', pronunciation:'dzai-jyen', tip:'Literally "see you again"', example:'再见，保重！— Goodbye, take care!' },
    ],
  },
  BR: {
    'Greetings': [
      { phrase:'Olá!', translation:'Hello!', pronunciation:'oh-LAH', tip:'Universal greeting', example:'Olá! Tudo bem? — Hello! How\'s everything?' },
      { phrase:'Tudo bem?', translation:'Everything okay? / How\'s it going?', pronunciation:'TOO-doo beng', tip:'Very common greeting', example:'Tudo bem, obrigado! — All good, thanks!' },
      { phrase:'Muito prazer', translation:'Very nice to meet you', pronunciation:'MOO-ee-too pra-ZAIR', tip:'When meeting someone', example:'Muito prazer em te conhecer! — Very nice to meet you!' },
      { phrase:'Obrigado/a', translation:'Thank you', pronunciation:'oh-bree-GAH-doo/dah', tip:'-o for men, -a for women', example:'Muito obrigado pela ajuda! — Thank you very much for the help!' },
      { phrase:'Tchau!', translation:'Bye! (casual)', pronunciation:'chow', tip:'Same as Italian Ciao', example:'Tchau! Até logo! — Bye! See you soon!' },
    ],
  },
}

type View = 'home' | 'lesson' | 'practice' | 'result'

export default function LanguagePage() {
  const [lang,      setLang]      = useState(LANGUAGES[0])
  const [topic,     setTopic]     = useState(TOPICS[0])
  const [view,      setView]      = useState<View>('home')
  const [lessons,   setLessons]   = useState<Lesson[]>([])
  const [cardIdx,   setCardIdx]   = useState(0)
  const [flipped,   setFlipped]   = useState(false)
  const [practiceIdx, setPracticeIdx] = useState(0)
  const [recording, setRecording] = useState(false)
  const [userSaid,  setUserSaid]  = useState('')
  const [feedback,  setFeedback]  = useState<'correct'|'close'|'wrong'|null>(null)
  const [speaking,  setSpeaking]  = useState(false)
  const [score,     setScore]     = useState(0)
  const [total,     setTotal]     = useState(0)
  const [error,     setError]     = useState('')
  const stopRef = useRef<(()=>void)|null>(null)

  function getLessons(l: typeof LANGUAGES[0], t: string): Lesson[] {
    const langData = LESSONS[l.code]
    if (!langData) return LESSONS['ES'][t] ?? LESSONS['ES']['Greetings']
    return langData[t] ?? langData[Object.keys(langData)[0]] ?? []
  }

  function startLesson() {
    const ls = getLessons(lang, topic)
    setLessons(ls); setView('lesson'); setCardIdx(0); setFlipped(false)
  }

  function startPractice() {
    setView('practice'); setPracticeIdx(0); setUserSaid(''); setFeedback(null); setScore(0); setTotal(0)
  }

  function speak(text: string) {
    setSpeaking(true)
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang.bcp47; u.rate = 0.75; u.pitch = 1.0
    u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  function startRecording() {
    setError(''); setUserSaid(''); setFeedback(null)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition requires Chrome or Edge browser. Please use Chrome for voice practice.')
      return
    }
    try {
      const r = new SR()
      r.lang = lang.bcp47; r.interimResults = false; r.continuous = false; r.maxAlternatives = 3
      r.onresult = (e: any) => {
        const said = e.results[0][0].transcript.trim()
        setUserSaid(said)
        checkPronunciation(said, lessons[practiceIdx].phrase)
      }
      r.onerror = (e: any) => {
        setRecording(false)
        if (e.error === 'not-allowed') setError('Microphone access denied. Click Allow in browser.')
        else if (e.error === 'no-speech') setError('No speech detected. Try speaking louder.')
        else if (e.error === 'network') setError('Voice recognition needs internet (Google servers). Use Chrome on localhost.')
        else setError(`Voice error: ${e.error}. Try Chrome browser.`)
      }
      r.onend = () => setRecording(false)
      r.start()
      stopRef.current = () => { try { r.stop() } catch {} }
      setRecording(true)
    } catch (e: any) {
      setError(`Cannot start recording: ${e.message}`)
    }
  }

  function checkPronunciation(said: string, target: string) {
    const clean = (s: string) => s.replace(/[^\w\s]/g, '').toLowerCase().trim()
    const sClean = clean(said); const tClean = clean(target)
    // Direct match
    if (sClean === tClean || sClean.includes(tClean) || tClean.includes(sClean)) {
      setFeedback('correct'); setScore(s=>s+1); setTotal(t=>t+1); return
    }
    // Word overlap
    const sWords = sClean.split(/\s+/); const tWords = tClean.split(/\s+/).filter(w=>w.length>2)
    if (tWords.length === 0) { setFeedback('correct'); setScore(s=>s+1); setTotal(t=>t+1); return }
    const matches = tWords.filter(w => sWords.some(sw => sw.includes(w.slice(0,3)) || w.includes(sw.slice(0,3))))
    const ratio = matches.length / tWords.length
    const fb = ratio >= 0.6 ? 'correct' : ratio >= 0.25 ? 'close' : 'wrong'
    setFeedback(fb); setTotal(t=>t+1)
    if (fb === 'correct') setScore(s=>s+1)
  }

  function nextPractice() {
    if (practiceIdx + 1 < lessons.length) {
      setPracticeIdx(i=>i+1); setUserSaid(''); setFeedback(null)
    } else {
      setView('result')
    }
  }

  const current = lessons[practiceIdx]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber/15 border border-amber/30 flex items-center justify-center">
            <Globe size={14} className="text-amber"/>
          </div>
          <div>
            <p className="text-bright font-semibold text-sm">Language Companion</p>
            <p className="text-[10px] text-dim font-mono">Learn · Speak · Practice offline</p>
          </div>
        </div>
        {view !== 'home' && (
          <button onClick={()=>{setView('home');setError('')}} className="btn-ghost text-xs">
            <RefreshCw size={11}/> Home
          </button>
        )}
      </div>

      {/* HOME */}
      {view === 'home' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center pt-1">
              <motion.div animate={{rotate:[0,5,-5,0]}} transition={{duration:4,repeat:Infinity}} className="text-3xl mb-2 inline-block">🌍</motion.div>
              <h2 className="text-bright font-bold text-base">Language Learning</h2>
              <p className="text-dim text-xs mt-0.5">Curated phrases · Pronunciation · Practice</p>
            </div>

            {/* Language grid */}
            <div>
              <p className="section-label mb-2">Choose Language</p>
              <div className="grid grid-cols-4 gap-2">
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={()=>setLang(l)}
                    className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 ${
                      lang.code===l.code ? 'bg-amber/15 border-amber/50 text-amber' : 'bg-card border-border hover:border-amber/30 text-dim'
                    }`}>
                    <div className="text-xl mb-0.5">{l.flag}</div>
                    <p className="text-[9px] font-bold">{l.code}</p>
                    <p className="text-[8px] text-dim">{l.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic grid */}
            <div>
              <p className="section-label mb-2">Choose Topic</p>
              <div className="grid grid-cols-2 gap-2">
                {TOPICS.map(t => (
                  <button key={t} onClick={()=>setTopic(t)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all text-left ${
                      topic===t ? 'bg-amber/15 border-amber/40 text-amber' : 'bg-card border-border text-dim hover:border-amber/30 hover:text-bright'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Available count */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border text-xs text-dim">
              <BookOpen size={12} className="text-amber"/>
              <span>{getLessons(lang, topic).length} phrases ready for <strong className="text-bright">{lang.name} · {topic}</strong></span>
            </div>
          </div>

          {/* Fixed bottom button */}
          <div className="flex-shrink-0 p-4 border-t border-border">
            <button onClick={startLesson}
              className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#000'}}>
              <Play size={16}/> Start {lang.flag} {lang.name} Lesson
            </button>
          </div>
        </div>
      )}

      {/* LESSON — flashcard style */}
      {view === 'lesson' && lessons.length > 0 && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-bright font-semibold">{lang.flag} {lang.name} · {topic}</p>
                <p className="text-dim text-xs">{lessons.length} phrases · tap card to flip</p>
              </div>
              <div className="flex items-center gap-1">
                {lessons.map((_,i)=>(
                  <button key={i} onClick={()=>{setCardIdx(i);setFlipped(false)}}
                    className={`w-2 h-2 rounded-full transition-all ${i===cardIdx?'bg-amber':'bg-muted/30'}`}/>
                ))}
              </div>
            </div>

            {/* 3D flip card */}
            <div onClick={()=>setFlipped(f=>!f)} className="cursor-pointer" style={{perspective:'800px',height:'200px'}}>
              <motion.div animate={{rotateY:flipped?180:0}} transition={{duration:0.4}}
                style={{transformStyle:'preserve-3d',position:'relative',height:'100%'}}>
                {/* Front — phrase */}
                <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center"
                  style={{backfaceVisibility:'hidden', background:'rgba(251,191,36,0.08)', border:'2px solid rgba(251,191,36,0.3)'}}>
                  <p className="text-[10px] text-amber font-mono uppercase tracking-wide mb-3">Tap to see translation</p>
                  <p className="text-3xl font-bold text-bright phrase-text mb-2">{lessons[cardIdx].phrase}</p>
                  <p className="text-sm text-amber/80 font-mono">🗣 {lessons[cardIdx].pronunciation}</p>
                </div>
                {/* Back — translation + tip */}
                <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center"
                  style={{backfaceVisibility:'hidden', transform:'rotateY(180deg)', background:'rgba(52,211,153,0.08)', border:'2px solid rgba(52,211,153,0.3)'}}>
                  <p className="text-[10px] text-accent font-mono uppercase tracking-wide mb-2">Translation</p>
                  <p className="text-2xl font-bold text-bright mb-3">{lessons[cardIdx].translation}</p>
                  {lessons[cardIdx].tip && (
                    <p className="text-xs text-iris/80 italic mb-2">💡 {lessons[cardIdx].tip}</p>
                  )}
                  {lessons[cardIdx].example && (
                    <p className="text-xs text-dim leading-relaxed">📝 {lessons[cardIdx].example}</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Nav */}
            <div className="flex gap-2">
              <button onClick={()=>{setCardIdx(i=>Math.max(0,i-1));setFlipped(false)}} disabled={cardIdx===0}
                className="btn-ghost flex-1 disabled:opacity-30"><ChevronLeft size={14}/> Prev</button>
              <button onClick={()=>speak(lessons[cardIdx].phrase)} disabled={speaking}
                className="w-12 h-10 rounded-xl bg-amber/10 border border-amber/25 flex items-center justify-center text-amber hover:bg-amber/20 transition-all active:scale-90">
                <Volume2 size={15}/>
              </button>
              <button onClick={()=>{setCardIdx(i=>Math.min(lessons.length-1,i+1));setFlipped(false)}} disabled={cardIdx===lessons.length-1}
                className="btn-ghost flex-1 disabled:opacity-30">Next <ChevronRight size={14}/></button>
            </div>

            {/* All phrases list */}
            <div className="space-y-2">
              <p className="section-label">All Phrases</p>
              {lessons.map((l,i)=>(
                <div key={i} className={`p-3 rounded-xl border transition-all cursor-pointer ${i===cardIdx?'bg-amber/8 border-amber/30':'bg-card border-border hover:border-amber/20'}`}
                  onClick={()=>{setCardIdx(i);setFlipped(false)}}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-bright text-sm font-semibold phrase-text">{l.phrase}</p>
                      <p className="text-accent text-xs">{l.translation}</p>
                      <p className="text-dim text-[10px] font-mono mt-0.5">🗣 {l.pronunciation}</p>
                    </div>
                    <button onClick={e=>{e.stopPropagation();speak(l.phrase)}}
                      className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center text-amber hover:bg-amber/20 transition-all flex-shrink-0">
                      <Volume2 size={12}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 p-4 border-t border-border">
            <button onClick={startPractice}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#000'}}>
              <Mic size={15}/> Start Pronunciation Practice
            </button>
          </div>
        </div>
      )}

      {/* PRACTICE */}
      {view === 'practice' && current && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-bright font-semibold text-sm">Pronunciation Practice</p>
              <div className="flex items-center gap-2">
                {total > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 border border-accent/20">
                    <Star size={10} className="text-accent"/>
                    <span className="text-[10px] text-accent font-mono">{score}/{total}</span>
                  </div>
                )}
                <span className="text-xs text-dim">{practiceIdx+1}/{lessons.length}</span>
              </div>
            </div>

            <div className="flex gap-1">
              {lessons.map((_,i)=>(
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i<practiceIdx?'bg-accent':i===practiceIdx?'bg-amber':'bg-muted/20'}`}/>
              ))}
            </div>

            {/* Target phrase card */}
            <div className="p-5 rounded-2xl text-center" style={{background:'rgba(251,191,36,0.08)',border:'2px solid rgba(251,191,36,0.25)'}}>
              <p className="text-[10px] text-amber font-mono uppercase tracking-wide mb-2">Say this phrase:</p>
              <p className="text-2xl font-bold text-bright mb-2 phrase-text">{current.phrase}</p>
              <p className="text-sm text-accent mb-1">{current.translation}</p>
              <p className="text-xs text-dim font-mono mb-3">🗣 {current.pronunciation}</p>
              <button onClick={()=>speak(current.phrase)} disabled={speaking}
                className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-full text-xs font-medium transition-all active:scale-95"
                style={{background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.3)', color:'#f59e0b'}}>
                <Volume2 size={12}/>{speaking ? 'Playing…' : 'Hear it'}
              </button>
            </div>

            {/* Tip & example */}
            {current.tip && (
              <div className="p-3 rounded-xl bg-iris/5 border border-iris/15">
                <p className="text-xs text-iris/80">💡 {current.tip}</p>
                {current.example && <p className="text-xs text-dim mt-1">📝 {current.example}</p>}
              </div>
            )}

            {/* Record button */}
            <motion.button whileTap={{scale:0.95}}
              onClick={recording ? ()=>{stopRef.current?.();setRecording(false)} : startRecording}
              disabled={!!feedback}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 ${
                recording ? 'bg-rose text-white' : 'bg-card border-2 border-dashed border-border hover:border-amber/40 text-bright'
              }`}
              style={recording ? {boxShadow:'0 0 20px rgba(244,63,94,0.4)'} : {}}>
              {recording
                ? <><motion.div animate={{scale:[1,1.3,1]}} transition={{duration:0.8,repeat:Infinity}} className="w-3 h-3 rounded-full bg-white"/>Recording…</>
                : <><Mic size={18}/> Tap to Speak</>
              }
            </motion.button>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                  className={`p-4 rounded-2xl border text-center ${
                    feedback==='correct' ? 'bg-accent/10 border-accent/30' :
                    feedback==='close'   ? 'bg-amber/10 border-amber/30' : 'bg-rose/10 border-rose/30'
                  }`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {feedback==='correct' ? <CheckCircle size={20} className="text-accent"/> :
                     feedback==='close'   ? <Zap size={20} className="text-amber"/> : <XCircle size={20} className="text-rose"/>}
                    <p className={`font-bold text-lg ${feedback==='correct'?'text-accent':feedback==='close'?'text-amber':'text-rose'}`}>
                      {feedback==='correct' ? '🎉 Perfect pronunciation!' : feedback==='close' ? '👍 Close! Keep practicing' : '🔄 Try again'}
                    </p>
                  </div>
                  {userSaid && <p className="text-xs text-dim">You said: "<span className="text-bright">{userSaid}</span>"</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber/10 border border-amber/25 text-amber text-xs">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5"/>{error}
              </div>
            )}
          </div>

          {feedback && (
            <div className="flex-shrink-0 p-4 border-t border-border">
              <button onClick={nextPractice}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#000'}}>
                {practiceIdx+1 < lessons.length ? <><ChevronRight size={14}/> Next Phrase</> : <><Trophy size={14}/> See Results</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULTS */}
      {view === 'result' && (
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-4">
          <motion.div animate={{scale:[1,1.1,1]}} transition={{duration:0.6}}>
            <Trophy size={48} className={score/total >= 0.8 ? 'text-accent' : 'text-amber'}/>
          </motion.div>
          <div>
            <p className="text-bright font-bold text-3xl">{score}/{total}</p>
            <p className="text-dim text-sm mt-1">
              {score===total ? '🎉 Perfect! Amazing pronunciation!' :
               score/total >= 0.7 ? '🌟 Great job! Keep practicing!' :
               score/total >= 0.5 ? '📚 Good effort! Practice makes perfect' : '💪 Keep going, you\'ll get it!'}
            </p>
          </div>
          <p className="text-accent text-sm">{lang.flag} {lang.name} · {topic}</p>
          <div className="flex gap-3 w-full">
            <button onClick={startPractice} className="btn-ghost flex-1"><RefreshCw size={13}/> Practice Again</button>
            <button onClick={()=>setView('lesson')} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-all" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}>
              <BookOpen size={13} className="inline mr-1"/> Review Phrases
            </button>
          </div>
          <button onClick={()=>setView('home')} className="text-xs text-dim hover:text-bright transition-colors">
            ← Choose different language / topic
          </button>
        </div>
      )}
    </div>
  )
}
