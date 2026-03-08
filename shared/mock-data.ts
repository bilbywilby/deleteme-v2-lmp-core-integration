import type { Service, Broker, SemanticTemplate, Identity } from './types';
export const MOCK_IDENTITY: Identity = {
  fullName: 'Protagonist Zero',
  email: 'operator@oblivion.net',
  address: 'Unit 404, Megacity-7 High-Rise',
  phone: '+1-555-0404',
  dob: '1995-12-31'
};
const CATEGORIES = ['Social', 'FinTech', 'Data Broker', 'E-commerce', 'SaaS', 'Health', 'Infrastructure'];
const generateServices = (count: number): Service[] => {
  const services: Service[] = [
    { id: 'fb', name: 'Facebook (Meta)', category: 'Social', difficulty: 'medium', contactMethod: 'direct-link', confidence: 95, url: 'https://facebook.com/help/delete_account', waitDays: 30, requiresVerification: true, requiresDocs: false },
    { id: 'google', name: 'Google Cloud Services', category: 'SaaS', difficulty: 'easy', contactMethod: 'direct-link', confidence: 98, url: 'https://myaccount.google.com/delete-services-or-account', waitDays: 0, requiresVerification: true, requiresDocs: false },
    { id: 'x', name: 'X / Twitter Core', category: 'Social', difficulty: 'easy', contactMethod: 'direct-link', confidence: 92, url: 'https://twitter.com/settings/deactivate', waitDays: 30, requiresVerification: true, requiresDocs: false },
    { id: 'acxiom', name: 'Acxiom Data Broker', category: 'Data Broker', difficulty: 'hard', contactMethod: 'email', confidence: 85, url: 'https://www.acxiom.com/privacy/opt-out/', privateEmail: 'privacy@acxiom.com', waitDays: 45, requiresVerification: true, requiresDocs: true },
    { id: 'palantir', name: 'Palantir Central Intelligence', category: 'Infrastructure', difficulty: 'hard', contactMethod: 'postal', confidence: 15, url: 'https://www.palantir.com/privacy-and-security/', waitDays: 90, requiresVerification: true, requiresDocs: true, isImpossible: true },
    { id: 'blackrock', name: 'BlackRock Financial', category: 'FinTech', difficulty: 'hard', contactMethod: 'postal', confidence: 20, url: 'https://www.blackrock.com/corporate/compliance/privacy-policy', waitDays: 60, requiresVerification: true, requiresDocs: true, isImpossible: true },
    { id: 'epsilon', name: 'Epsilon Marketing Group', category: 'Data Broker', difficulty: 'medium', contactMethod: 'ticket', confidence: 80, url: 'https://www.epsilon.com/us/consumer-preference-center', waitDays: 30, requiresVerification: false, requiresDocs: false }
  ];
  for (let i = services.length; i < count; i++) {
    const diffs: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const methods: ('direct-link' | 'email' | 'ticket' | 'phone')[] = ['direct-link', 'email', 'ticket', 'phone'];
    const isImp = i % 18 === 0;
    services.push({
      id: `svc-${i}`,
      name: `Core_Entity_${i}`,
      category: CATEGORIES[i % CATEGORIES.length],
      difficulty: isImp ? 'hard' : diffs[i % 3],
      contactMethod: methods[i % 4],
      confidence: 50 + (i % 50),
      url: `https://node-access.io/erasure/${i}`,
      waitDays: (i % 45),
      requiresVerification: i % 4 === 0,
      requiresDocs: i % 12 === 0,
      isImpossible: isImp,
      notes: `Standard LMP entry for node sequence ${i}.`
    });
  }
  return services;
};
export const SERVICES = generateServices(60);
export const DATA_BROKERS: Broker[] = SERVICES
  .filter(s => s.category === 'Data Broker')
  .map(s => ({ ...s, optOutUrl: s.url }));
export const MOCK_TEMPLATES: SemanticTemplate[] = [
  {
    id: 't-gdpr',
    service: 'Standard',
    type: 'gdpr',
    template: 'Subject: EXERCISE OF RIGHT TO ERASURE (GDPR ARTICLE 17)\n\nATTENTION: Data Protection Officer,\n\nI, {{fullName}}, am formally exercising my right to erasure under Article 17 of the General Data Protection Regulation (GDPR). \n\nI request the immediate and permanent deletion of my account and all associated personal identifiers from your primary databases, secondary storage, and third-party processors. \n\nIdentity Context:\n- Name: {{fullName}}\n- Registered Email: {{email}}\n- Registered Address: {{address}}\n- Date of Birth: {{dob}}\n\nPlease confirm the successful execution of this request within the statutory 30-day period. \n\nTransmission ID: LMP-{{email}}',
    effectiveness: 99
  },
  {
    id: 't-ccpa',
    service: 'Standard',
    type: 'ccpa',
    template: 'Subject: CCPA CONSUMER RIGHT TO DELETE REQUEST\n\nTo the Privacy/Compliance Department,\n\nAs a California resident, I am exercising my right to delete personal information collected about me, as provided under the California Consumer Privacy Act (CCPA). \n\nRequested Action:\nDelete all personal information associated with my identity and provide verification of same. This request includes any information shared with service providers or third parties. \n\nIdentity Verification:\n- Full Name: {{fullName}}\n- Verified Email: {{email}}\n- Phone: {{phone}}\n\nI expect verification of the completion of this request within the 45-day CCPA compliance window. \n\nReference: OBLIVION-PROTOCOL-{{fullName}}',
    effectiveness: 95
  }
];