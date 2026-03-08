import type { Service, Broker, SemanticTemplate, Identity } from './types';
export const MOCK_IDENTITY: Identity = {
  fullName: 'Protagonist One',
  email: 'p1@example.com',
  address: '123 Neo-Tokyo Blvd, Sector 7',
  phone: '+1-555-0199',
  dob: '1990-01-01'
};
const CATEGORIES = ['Social', 'FinTech', 'Data Broker', 'E-commerce', 'SaaS', 'Health'];
const generateServices = (count: number): Service[] => {
  const services: Service[] = [
    { id: 'fb', name: 'Facebook', category: 'Social', difficulty: 'medium', contactMethod: 'direct-link', confidence: 95, url: 'https://facebook.com/help/delete_account', waitDays: 30, requiresVerification: true, requiresDocs: false },
    { id: 'google', name: 'Google', category: 'SaaS', difficulty: 'easy', contactMethod: 'direct-link', confidence: 98, url: 'https://myaccount.google.com/delete-services-or-account', waitDays: 0, requiresVerification: true, requiresDocs: false },
    { id: 'x', name: 'X (Twitter)', category: 'Social', difficulty: 'easy', contactMethod: 'direct-link', confidence: 92, url: 'https://twitter.com/settings/deactivate', waitDays: 30, requiresVerification: true, requiresDocs: false },
    { id: 'acxiom', name: 'Acxiom', category: 'Data Broker', difficulty: 'hard', contactMethod: 'email', confidence: 85, url: 'https://www.acxiom.com/privacy/opt-out/', privateEmail: 'privacy@acxiom.com', waitDays: 45, requiresVerification: true, requiresDocs: true },
    { id: 'palantir', name: 'Palantir Technologies', category: 'SaaS', difficulty: 'hard', contactMethod: 'postal', confidence: 40, url: 'https://www.palantir.com/privacy-and-security/', waitDays: 90, requiresVerification: true, requiresDocs: true, isImpossible: true },
    { id: 'epsilon', name: 'Epsilon', category: 'Data Broker', difficulty: 'medium', contactMethod: 'ticket', confidence: 80, url: 'https://www.epsilon.com/us/consumer-preference-center', waitDays: 30, requiresVerification: false, requiresDocs: false }
  ];
  for (let i = services.length; i < count; i++) {
    const diffs: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const methods: ('direct-link' | 'email' | 'ticket' | 'phone')[] = ['direct-link', 'email', 'ticket', 'phone'];
    services.push({
      id: `svc-${i}`,
      name: `Service ${i}`,
      category: CATEGORIES[i % CATEGORIES.length],
      difficulty: diffs[i % 3],
      contactMethod: methods[i % 4],
      confidence: 70 + (i % 30),
      url: `https://example.com/delete/${i}`,
      waitDays: (i % 60),
      requiresVerification: i % 5 === 0,
      requiresDocs: i % 10 === 0,
      isImpossible: i % 25 === 0,
      notes: `Generated seed data for protocol ${i}`
    });
  }
  return services;
};
export const SERVICES = generateServices(100);
export const DATA_BROKERS: Broker[] = SERVICES
  .filter(s => s.category === 'Data Broker')
  .map(s => ({ ...s, optOutUrl: s.url }));
export const MOCK_TEMPLATES: SemanticTemplate[] = [
  {
    id: 't-gdpr',
    service: 'Standard',
    type: 'gdpr',
    template: 'Subject: Right to Erasure Request (GDPR Article 17)\n\nTo whom it may concern,\n\nI, {{fullName}}, am writing to formally request the permanent deletion of my account and all associated personal data from your systems. This request is made under Article 17 of the GDPR.\n\nIdentity Reference:\nEmail: {{email}}\nAddress: {{address}}\n\nPlease confirm receipt and execution within 30 days.',
    effectiveness: 99
  },
  {
    id: 't-ccpa',
    service: 'Standard',
    type: 'ccpa',
    template: 'Subject: CCPA Right to Delete Request\n\nTo the Privacy Team,\n\nI am a California resident and I am exercising my right to request that you delete any personal information about me which you have collected. This request is submitted pursuant to the California Consumer Privacy Act (CCPA).\n\nMy Details:\nFull Name: {{fullName}}\nEmail Associated: {{email}}\n\nPlease provide verification of the deletion within 45 days as required by law.',
    effectiveness: 95
  }
];