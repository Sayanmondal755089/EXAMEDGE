/**
 * seed.js — Run this ONCE to populate your database with sample articles.
 * This lets you test the full app immediately without waiting for the news pipeline.
 *
 * Usage:  node seed.js
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/examedge';

const articleSchema = new mongoose.Schema({
  title: String, sourceUrl: String, sourceName: String, urlHash: String,
  publishedAt: Date, fetchedAt: { type: Date, default: Date.now },
  category: String, examRelevance: String,
  content: { originalText: String, summary: String, keyPoints: [String] },
  quizzes: [{
    question: String, options: [String],
    correctIndex: Number, explanation: String, _id: false
  }],
  isFree: { type: Boolean, default: false },
  aiProcessed: { type: Boolean, default: true },
  aiProcessedAt: Date,
}, { timestamps: true });
articleSchema.index({ urlHash: 1 }, { unique: true });
const Article = mongoose.model('Article', articleSchema);

const SAMPLE_ARTICLES = [
  {
    title: 'RBI Maintains Repo Rate at 6.5%, Signals Cautious Stance Amid Global Uncertainties',
    sourceUrl: 'https://pib.gov.in/rbi-repo-rate-2024',
    sourceName: 'PIB India',
    urlHash: 'seed_001',
    publishedAt: new Date(),
    category: 'economy',
    examRelevance: 'high',
    isFree: true,
    content: {
      summary: 'The Reserve Bank of India\'s Monetary Policy Committee unanimously decided to keep the repo rate unchanged at 6.5% in its latest bi-monthly review. Governor Shaktikanta Das cited persistent global headwinds, elevated food inflation, and geopolitical uncertainties as key factors. The committee retained the GDP growth forecast at 7% for the current fiscal year.',
      keyPoints: [
        'Repo rate held at 6.5% — unchanged for the third consecutive MPC meeting',
        'GDP growth forecast retained at 7% for FY2024-25',
        'Food inflation remains a concern; headline CPI at 5.4% above 4% target',
        'Standing Deposit Facility (SDF) rate maintained at 6.25%',
        'MPC voted 5:1 in favour of maintaining the current stance'
      ]
    },
    quizzes: [
      {
        question: 'Which body is responsible for setting the repo rate in India?',
        options: ['A) Finance Ministry', 'B) Monetary Policy Committee (RBI)', 'C) SEBI', 'D) NITI Aayog'],
        correctIndex: 1,
        explanation: 'The Monetary Policy Committee (MPC) of the RBI sets the benchmark repo rate under the flexible inflation targeting framework.'
      },
      {
        question: 'What is the current CPI inflation target set by the Government of India?',
        options: ['A) 2%', 'B) 3%', 'C) 4%', 'D) 6%'],
        correctIndex: 2,
        explanation: 'The RBI\'s mandated CPI inflation target is 4%, with a tolerance band of +/- 2% (i.e., 2% to 6%).'
      }
    ]
  },
  {
    title: 'India Launches National Quantum Mission with ₹6,003 Crore Outlay to Build Quantum Computers',
    sourceUrl: 'https://thehindu.com/national-quantum-mission-2024',
    sourceName: 'The Hindu',
    urlHash: 'seed_002',
    publishedAt: new Date(),
    category: 'technology',
    examRelevance: 'high',
    isFree: true,
    content: {
      summary: 'The Union Cabinet has approved the National Quantum Mission (NQM) with a budget of ₹6,003 crore spanning 2023 to 2031. The mission aims to develop quantum computers with 50-1000 physical qubits, satellite-based quantum communications, and quantum cryptography. India joins the US, China, and European nations in launching a national quantum initiative.',
      keyPoints: [
        'Budget: ₹6,003 crore approved for 2023-2031 (8-year mission)',
        'Target: Develop computers with 50-1000 qubit quantum systems',
        'Goals include quantum communication, sensing, and cryptography',
        'India joins US, China, Finland, France, Austria, Canada in national quantum missions',
        'Nodal ministry: Department of Science and Technology (DST)'
      ]
    },
    quizzes: [
      {
        question: 'What is the budget allocated for India\'s National Quantum Mission?',
        options: ['A) ₹1,003 crore', 'B) ₹3,600 crore', 'C) ₹6,003 crore', 'D) ₹8,000 crore'],
        correctIndex: 2,
        explanation: 'The Union Cabinet approved ₹6,003 crore for the National Quantum Mission (NQM) for the period 2023-2031.'
      },
      {
        question: 'Which ministry is the nodal body for the National Quantum Mission?',
        options: ['A) Ministry of Electronics and IT', 'B) Department of Science and Technology', 'C) DRDO', 'D) Ministry of Finance'],
        correctIndex: 1,
        explanation: 'The Department of Science and Technology (DST) under the Ministry of Science and Technology is the nodal agency for NQM.'
      }
    ]
  },
  {
    title: 'PM GatiShakti National Master Plan Surpasses 1,600 Projects Worth ₹27 Lakh Crore',
    sourceUrl: 'https://business-standard.com/pm-gatishakti-2024',
    sourceName: 'Business Standard',
    urlHash: 'seed_003',
    publishedAt: new Date(),
    category: 'current_affairs',
    examRelevance: 'high',
    isFree: true,
    content: {
      summary: 'The PM GatiShakti National Master Plan has now integrated over 1,600 infrastructure projects worth ₹27 lakh crore across 44 ministries. The platform uses GIS-based mapping to enable real-time coordination between central and state agencies, reducing project delays by an estimated 30% and logistics costs for industry.',
      keyPoints: [
        'PM GatiShakti launched: October 2021 by Prime Minister Narendra Modi',
        'Over 1,600 projects worth ₹27 lakh crore now on the platform',
        '44 central ministries and all states integrated into GIS portal',
        'Aims to reduce logistics cost from ~14% to under 8% of GDP',
        'Based on seven engines: Roads, Railways, Airports, Ports, Mass Transport, Waterways, Logistics'
      ]
    },
    quizzes: [
      {
        question: 'PM GatiShakti National Master Plan is based on how many infrastructure "engines"?',
        options: ['A) 5', 'B) 7', 'C) 9', 'D) 12'],
        correctIndex: 1,
        explanation: 'PM GatiShakti is based on 7 engines: Roads, Railways, Airports, Ports, Mass Transport, Waterways, and Logistics Infrastructure.'
      },
      {
        question: 'When was the PM GatiShakti National Master Plan officially launched?',
        options: ['A) January 2020', 'B) October 2021', 'C) March 2022', 'D) August 2023'],
        correctIndex: 1,
        explanation: 'PM GatiShakti was launched by Prime Minister Modi on 13 October 2021 with a focus on integrated infrastructure planning.'
      }
    ]
  },
  {
    title: 'ISRO Successfully Tests Gaganyaan Crew Escape System, Clears Path for Human Spaceflight',
    sourceUrl: 'https://isro.gov.in/gaganyaan-tv-d1-test-2024',
    sourceName: 'ISRO',
    urlHash: 'seed_004',
    publishedAt: new Date(),
    category: 'science',
    examRelevance: 'medium',
    content: {
      summary: 'ISRO successfully conducted the Test Vehicle Abort Mission-1 (TV-D1) for the Crew Escape System of the Gaganyaan human spaceflight programme. The Crew Module was ejected at 17 km altitude and safely parachuted into the Bay of Bengal. This critical test validates the safety mechanism protecting astronauts in case of a launch failure.',
      keyPoints: [
        'TV-D1 test conducted from Sriharikota — Crew Escape System validated',
        'Crew Module parachuted safely into Bay of Bengal after ejection at 17 km altitude',
        'Gaganyaan aims to send 3 Indian astronauts (Vyomanauts) to 400 km orbit',
        'Mission duration planned: 3 days in low earth orbit (LEO)',
        'India will be 4th nation after USSR, US, China to achieve independent human spaceflight'
      ]
    },
    quizzes: [
      {
        question: 'What is the name given to Indian astronauts selected for the Gaganyaan mission?',
        options: ['A) Astronauts', 'B) Cosmonauts', 'C) Vyomanauts', 'D) Taraanauts'],
        correctIndex: 2,
        explanation: 'Indian astronauts/crew members for the Gaganyaan mission are called "Vyomanauts" — from "Vyoma" (Sanskrit for sky/space).'
      },
      {
        question: 'How many days is the Gaganyaan crewed mission planned to orbit Earth?',
        options: ['A) 1 day', 'B) 3 days', 'C) 7 days', 'D) 14 days'],
        correctIndex: 1,
        explanation: 'The Gaganyaan mission is planned for a 3-day stay in Low Earth Orbit (LEO) at approximately 400 km altitude.'
      }
    ]
  },
  {
    title: 'India\'s Direct Tax Collection Surges 18.4% to ₹16.97 Lakh Crore, Beats FY24 Target',
    sourceUrl: 'https://finmin.gov.in/direct-tax-fy24-2024',
    sourceName: 'Ministry of Finance',
    urlHash: 'seed_005',
    publishedAt: new Date(),
    category: 'economy',
    examRelevance: 'high',
    content: {
      summary: 'India\'s gross direct tax collections for FY2023-24 grew 18.4% year-on-year to reach ₹16.97 lakh crore, exceeding the revised budget estimate of ₹16.50 lakh crore. Personal income tax collections grew by 25.2% while corporate tax collections increased by 12.4%. The advance tax collection for FY24 also registered 27.3% growth.',
      keyPoints: [
        'Gross direct tax collection: ₹16.97 lakh crore — 18.4% growth YoY',
        'Personal Income Tax growth: 25.2% — higher than corporate tax (12.4%)',
        'Advance tax collection grew 27.3% — indicates strong corporate earnings',
        'Tax-to-GDP ratio improved to 6.64% from 5.98% previous year',
        'Refunds of ₹3.38 lakh crore issued during the year'
      ]
    },
    quizzes: [
      {
        question: 'What is the difference between direct tax and indirect tax?',
        options: ['A) Direct tax is levied on goods; indirect on income', 'B) Direct tax burden falls on the payer; indirect can be shifted to others', 'C) Direct taxes are collected by states; indirect by Centre', 'D) There is no difference'],
        correctIndex: 1,
        explanation: 'Direct taxes (income tax, corporate tax) cannot be shifted — the burden falls on the person who pays it. Indirect taxes (GST) can be passed on to consumers.'
      },
      {
        question: 'Which body administers direct taxes in India?',
        options: ['A) RBI', 'B) SEBI', 'C) CBDT', 'D) GSTN'],
        correctIndex: 2,
        explanation: 'The Central Board of Direct Taxes (CBDT) under the Ministry of Finance administers all direct taxes including income tax and corporate tax.'
      }
    ]
  },
  {
    title: 'India and UAE Sign Bilateral Investment Treaty, Setting $25 Billion Investment Target',
    sourceUrl: 'https://mea.gov.in/india-uae-bit-2024',
    sourceName: 'MEA India',
    urlHash: 'seed_006',
    publishedAt: new Date(),
    category: 'international',
    examRelevance: 'medium',
    content: {
      summary: 'India and the UAE signed a Bilateral Investment Treaty (BIT) targeting bilateral investments of over $25 billion by 2030. The treaty includes investor protection provisions, dispute settlement mechanisms, and special facilitation for Indian MSMEs in UAE free zones. It builds on the Comprehensive Economic Partnership Agreement (CEPA) signed in 2022.',
      keyPoints: [
        'BIT signed between India and UAE — targets $25 billion bilateral investment by 2030',
        'Includes MSME investment facilitation in UAE\'s free trade zones',
        'Part of the CEPA framework signed in February 2022',
        'UAE is India\'s 3rd largest trading partner and 2nd largest export destination',
        'Bilateral trade stands at $85 billion — target is $100 billion by 2030'
      ]
    },
    quizzes: [
      {
        question: 'What is India\'s current rank of UAE as a trading partner?',
        options: ['A) 1st', 'B) 2nd', 'C) 3rd', 'D) 5th'],
        correctIndex: 2,
        explanation: 'UAE is India\'s 3rd largest trading partner overall, but 2nd largest export destination. The US is the largest export destination.'
      },
      {
        question: 'What does BIT stand for in international trade?',
        options: ['A) Banking Investment Treaty', 'B) Bilateral Investment Treaty', 'C) Business Import Tariff', 'D) Bilateral Import Tax'],
        correctIndex: 1,
        explanation: 'BIT stands for Bilateral Investment Treaty — an agreement between two countries to protect and promote cross-border investments.'
      }
    ]
  },
  {
    title: 'Jal Jeevan Mission Achieves 14 Crore Tap Water Connections; Targets 100% Coverage',
    sourceUrl: 'https://jalshakti.gov.in/jjm-14crore-2024',
    sourceName: 'Ministry of Jal Shakti',
    urlHash: 'seed_007',
    publishedAt: new Date(),
    category: 'current_affairs',
    examRelevance: 'high',
    content: {
      summary: 'The Jal Jeevan Mission (JJM), launched in August 2019, has connected over 14 crore rural households with functional tap water connections, achieving nearly 74% coverage from just 16.8% when the mission started. The mission aims to provide safe and adequate drinking water through individual household tap connections to all rural households by 2024.',
      keyPoints: [
        'JJM launched: August 2019 — "Har Ghar Jal" initiative by PM Modi',
        'Progress: 14 crore connections — from 16.8% to 74% rural coverage',
        'Budget: ₹3.60 lakh crore (Central + State share combined)',
        '5 states achieved 100% coverage: Goa, Telangana, Haryana, Gujarat, Punjab',
        'BIS-certified water testing labs set up in each district'
      ]
    },
    quizzes: [
      {
        question: 'What was the tap water coverage in rural India when Jal Jeevan Mission was launched in 2019?',
        options: ['A) 32%', 'B) 50%', 'C) 16.8%', 'D) 8%'],
        correctIndex: 2,
        explanation: 'When Jal Jeevan Mission launched in August 2019, only 16.8% of rural households had tap water connections.'
      },
      {
        question: 'What is the tagline/slogan of the Jal Jeevan Mission?',
        options: ['A) Swachh Jal Swasth Jal', 'B) Har Ghar Jal', 'C) Jal Hi Jeevan', 'D) Nal Se Jal'],
        correctIndex: 1,
        explanation: '"Har Ghar Jal" (Water to every household) is the tagline of Jal Jeevan Mission.'
      }
    ]
  },
  {
    title: 'India Crosses 900 Million Internet Users; Rural Broadband Surpasses Urban for First Time',
    sourceUrl: 'https://trai.gov.in/internet-users-900million-2024',
    sourceName: 'TRAI',
    urlHash: 'seed_008',
    publishedAt: new Date(),
    category: 'technology',
    examRelevance: 'medium',
    content: {
      summary: 'India has crossed 900 million internet subscribers, with rural broadband subscribers (480 million) surpassing urban subscribers for the first time. This milestone is attributed to the BharatNet project, affordable data prices averaging ₹10.9/GB, and increased smartphone penetration in Tier 2 and Tier 3 cities.',
      keyPoints: [
        'India total internet users: 900+ million — 2nd largest globally after China',
        'Rural broadband users: 480 million — exceeded urban for first time',
        'Average mobile data cost: ₹10.9/GB — among lowest globally',
        'BharatNet: 2 lakh+ gram panchayats connected with optical fibre',
        'Mobile internet comprises 95% of all internet access in India'
      ]
    },
    quizzes: [
      {
        question: 'India is the world\'s ______ largest internet user base.',
        options: ['A) 1st', 'B) 2nd', 'C) 3rd', 'D) 4th'],
        correctIndex: 1,
        explanation: 'India is the 2nd largest internet user base in the world after China, having crossed 900 million subscribers.'
      },
      {
        question: 'What is the BharatNet project aimed at?',
        options: ['A) Mobile tower deployment in cities', 'B) Connecting gram panchayats with optical fibre broadband', 'C) Satellite internet for defence', 'D) 5G rollout in metro cities'],
        correctIndex: 1,
        explanation: 'BharatNet is a government project to provide high-speed broadband connectivity to all 2.5 lakh gram panchayats using optical fibre.'
      }
    ]
  },
  {
    title: 'India\'s Manufacturing PMI Rises to 58.7 in October, Highest in 16 Years',
    sourceUrl: 'https://reuters.com/india-pmi-october-2024',
    sourceName: 'Reuters',
    urlHash: 'seed_009',
    publishedAt: new Date(),
    category: 'economy',
    examRelevance: 'medium',
    content: {
      summary: 'India\'s Manufacturing Purchasing Managers\' Index (PMI) rose to 58.7 in October, the highest level in 16 years, driven by strong domestic demand and new export orders. The reading above 50 indicates expansion. The services PMI also remained robust at 58.4, keeping the composite PMI at a healthy 58.5.',
      keyPoints: [
        'Manufacturing PMI: 58.7 in October — highest in 16 years (above 50 = expansion)',
        'Strong domestic demand and new export orders drove the expansion',
        'Services PMI: 58.4 — composite PMI at 58.5',
        'PMI compiled by S&P Global on behalf of HSBC for India',
        'India among fastest-growing large economies with PMI consistently above 55'
      ]
    },
    quizzes: [
      {
        question: 'What does a PMI reading above 50 indicate?',
        options: ['A) Economic contraction', 'B) Economic expansion', 'C) No change in economic activity', 'D) High inflation'],
        correctIndex: 1,
        explanation: 'A PMI (Purchasing Managers\' Index) reading above 50 indicates expansion in the sector. Below 50 indicates contraction. It is a leading economic indicator.'
      },
      {
        question: 'Who compiles the India Manufacturing PMI?',
        options: ['A) RBI', 'B) NITI Aayog', 'C) S&P Global / HSBC', 'D) Ministry of Finance'],
        correctIndex: 2,
        explanation: 'The India Manufacturing PMI is compiled by S&P Global on behalf of HSBC, based on a survey of purchasing managers in Indian manufacturing companies.'
      }
    ]
  },
  {
    title: 'Supreme Court Rules PMLA Money Laundering Provisions Constitutional, Upholds ED Powers',
    sourceUrl: 'https://livelaw.in/pmla-supreme-court-2024',
    sourceName: 'LiveLaw',
    urlHash: 'seed_010',
    publishedAt: new Date(),
    category: 'current_affairs',
    examRelevance: 'high',
    content: {
      summary: 'The Supreme Court of India upheld the constitutional validity of key provisions of the Prevention of Money Laundering Act (PMLA), including the Enforcement Directorate\'s powers of arrest, attachment, and search without a magistrate\'s warrant. The court ruled that PMLA\'s twin conditions for bail — proving innocence and unlikelihood of repeat offence — do not violate fundamental rights.',
      keyPoints: [
        'PMLA provisions upheld as constitutional by the Supreme Court',
        'ED\'s powers of arrest without magistrate warrant validated',
        'Twin bail conditions under PMLA do not violate Article 21 (Right to Life)',
        'PMLA enacted in 2002 to combat money laundering linked to scheduled offences',
        'ED operates under the Ministry of Finance; investigates financial crimes'
      ]
    },
    quizzes: [
      {
        question: 'What does PMLA stand for?',
        options: ['A) Prevention of Money Laundering Act', 'B) Public Money Lending Act', 'C) Prevention of Market Liability Act', 'D) Public Monetary Laws Act'],
        correctIndex: 0,
        explanation: 'PMLA stands for Prevention of Money Laundering Act, enacted in 2002. It defines money laundering offences and gives the Enforcement Directorate (ED) powers to investigate and prosecute them.'
      },
      {
        question: 'Under which ministry does the Enforcement Directorate (ED) operate?',
        options: ['A) Ministry of Home Affairs', 'B) Ministry of Law and Justice', 'C) Ministry of Finance', 'D) Ministry of Corporate Affairs'],
        correctIndex: 2,
        explanation: 'The Enforcement Directorate (ED) is a financial investigation agency operating under the Department of Revenue, Ministry of Finance.'
      }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);

    // Clear existing seeded articles
    await Article.deleteMany({ urlHash: { $regex: /^seed_/ } });
    console.log('🧹 Cleared old seed data');

    // Insert fresh seed articles
    const inserted = await Article.insertMany(SAMPLE_ARTICLES, { ordered: false });
    console.log(`✅ Inserted ${inserted.length} sample articles`);

    // Mark first 3 as free (for homepage preview)
    const ids = inserted.slice(0, 3).map(a => a._id);
    await Article.updateMany({ _id: { $in: ids } }, { isFree: true });
    console.log('✅ Marked 3 articles as free preview');

    console.log('\n🚀 Seed complete! Your app is ready to use.');
    console.log('   Start the server: npm run dev');
    console.log('   Open: http://localhost:5000\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
