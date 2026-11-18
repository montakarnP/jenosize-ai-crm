import { PrismaClient, type LeadSource, type LeadStage } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo-CRM-2026";

const users = [
  {
    id: "user_max",
    email: "max@jenosize.test",
    name: "Nattasate (Max) Trithipcharoenchai",
    title: "CEO & Founder",
    role: "ADMIN" as const,
  },
  {
    id: "user_aoy",
    email: "aoy@jenosize.test",
    name: "Pinyapat (Aoy) Trithipcharoenchai",
    title: "Director",
    role: "ADMIN" as const,
  },
  {
    id: "user_tak",
    email: "tak@jenosize.test",
    name: "Kanchaporn (Tak) Kiatnawin",
    title: "Managing Director, Digital",
    role: "ADMIN" as const,
  },
  {
    id: "user_jom",
    email: "jom@jenosize.test",
    name: "Phiboontapp (Jom) Kongkunchad",
    title: "Asst. Director, Event",
    role: "ADMIN" as const,
  },
  {
    id: "user_zam",
    email: "zam@jenosize.test",
    name: "Patipan (Zam) Plangpattanapanich",
    title: "Business Development Director",
    role: "ADMIN" as const,
  },
  {
    id: "user_lisa",
    email: "lisa@jenosize.test",
    name: "Lisa Tham",
    title: "Head of Product Design & Quality",
    role: "ADMIN" as const,
  },
  {
    id: "user_anna",
    email: "jenosize.sales@jenosize.test",
    name: "Jenosize Sales",
    title: "Sales",
    role: "SALES" as const,
  },
  {
    id: "user_erik",
    email: "jenosize.admin@jenosize.test",
    name: "Jenosize Admin",
    title: "Admin",
    role: "ADMIN" as const,
  },
];

const companies = [
  { id: "co_cpall", name: "CP ALL Public Company Limited", industry: "Retail" },
  { id: "co_themall", name: "THE MALL GROUP COMPANY LIMITED", industry: "Retail" },
  { id: "co_bigc", name: "Big C Supercenter Public Company Limited", industry: "Retail" },
  { id: "co_cpn", name: "Central Pattana Public Company Limited (CPN)", industry: "Retail" },
  { id: "co_watson", name: "Central Watson Co., Ltd.", industry: "Retail" },
  { id: "co_kingpower", name: "King Power Corporation Co., Ltd.", industry: "Retail" },
  { id: "co_jimthompson", name: "The Thai Silk Company Limited (JIM THOMPSON)", industry: "Fashion" },
  { id: "co_jaspal", name: "Jaspal Public Company Limited", industry: "Fashion" },
  { id: "co_rubbersoul", name: "Rubber Soul Co., Ltd.", industry: "Fashion" },
  { id: "co_tat", name: "Tourism Authority of Thailand (TAT)", industry: "Government" },
  { id: "co_etda", name: "Electronic Transactions Development Agency (ETDA)", industry: "Government" },
  { id: "co_gistda", name: "Geo-Informatics and Space Technology Development Agency (GISTDA)", industry: "Government" },
  { id: "co_oishi", name: "Oishi Group Public Company Limited", industry: "FMCG" },
  { id: "co_meiji", name: "Meiji (Thailand) Co., Ltd.", industry: "FMCG" },
  { id: "co_dutchmill", name: "Dutch Mill Co., Ltd.", industry: "FMCG" },
  { id: "co_muangthai", name: "Muang Thai Insurance Public Company Limited", industry: "Banking & Insurance" },
  { id: "co_counterservice", name: "Counter Service Co., Ltd.", industry: "Banking & Insurance" },
  { id: "co_bki", name: "Bangkok Insurance Public Company Limited", industry: "Banking & Insurance" },
  { id: "co_scasset", name: "SC Asset Corporation Public Company Limited", industry: "Real Estate" },
  { id: "co_pf", name: "Property Perfect Public Company Limited", industry: "Real Estate" },
];

const contacts = [
  { id: "ct_cpall", companyId: "co_cpall", name: "CPALL Contact", email: "cpall@example.test", phone: "+66-80-000-0101", title: "Contact", lineUserId: null },
  { id: "ct_themall", companyId: "co_themall", name: "THEMALL Contact", email: "themall@example.test", phone: "+66-80-000-0102", title: "Contact", lineUserId: null },
  { id: "ct_bigc", companyId: "co_bigc", name: "BigC Contact", email: "bigc@example.test", phone: "+66-80-000-0103", title: "Contact", lineUserId: null },
  { id: "ct_cpn", companyId: "co_cpn", name: "CPN Contact", email: "cpn@example.test", phone: "+66-80-000-0104", title: "Contact", lineUserId: null },
  { id: "ct_watson", companyId: "co_watson", name: "Watson Contact", email: "watson@example.test", phone: "+66-80-000-0105", title: "Contact", lineUserId: null },
  { id: "ct_kingpower", companyId: "co_kingpower", name: "KingPower Contact", email: "kingpower@example.test", phone: "+66-80-000-0106", title: "Contact", lineUserId: null },
  { id: "ct_jimthompson", companyId: "co_jimthompson", name: "JIMTHOMPSON Contact", email: "jimthompson@example.test", phone: "+66-80-000-0201", title: "Contact", lineUserId: null },
  { id: "ct_jaspal", companyId: "co_jaspal", name: "Jaspal Contact", email: "jaspal@example.test", phone: "+66-80-000-0202", title: "Contact", lineUserId: null },
  { id: "ct_rubbersoul", companyId: "co_rubbersoul", name: "RubberSoul Contact", email: "rubbersoul@example.test", phone: "+66-80-000-0203", title: "Contact", lineUserId: null },
  { id: "ct_tat", companyId: "co_tat", name: "TAT Contact", email: "tat@example.test", phone: "+66-80-000-0301", title: "Contact", lineUserId: "UdemoLineUser0002" },
  { id: "ct_etda", companyId: "co_etda", name: "ETDA Contact", email: "etda@example.test", phone: "+66-80-000-0302", title: "Contact", lineUserId: null },
  { id: "ct_gistda", companyId: "co_gistda", name: "GISTDA Contact", email: "gistda@example.test", phone: "+66-80-000-0303", title: "Contact", lineUserId: null },
  { id: "ct_oishi", companyId: "co_oishi", name: "Oishi Contact", email: "oishi@example.test", phone: "+66-80-000-0401", title: "Contact", lineUserId: "UdemoLineUser0001" },
  { id: "ct_meiji", companyId: "co_meiji", name: "Meiji Contact", email: "meiji@example.test", phone: "+66-80-000-0402", title: "Contact", lineUserId: null },
  { id: "ct_dutchmill", companyId: "co_dutchmill", name: "DutchMill Contact", email: "dutchmill@example.test", phone: "+66-80-000-0403", title: "Contact", lineUserId: null },
  { id: "ct_muangthai", companyId: "co_muangthai", name: "MuangThai Contact", email: "muangthai@example.test", phone: "+66-80-000-0501", title: "Contact", lineUserId: null },
  { id: "ct_counterservice", companyId: "co_counterservice", name: "CounterService Contact", email: "counterservice@example.test", phone: "+66-80-000-0502", title: "Contact", lineUserId: null },
  { id: "ct_bki", companyId: "co_bki", name: "BangkokInsurance Contact", email: "bangkokinsurance@example.test", phone: "+66-80-000-0503", title: "Contact", lineUserId: null },
  { id: "ct_scasset", companyId: "co_scasset", name: "SCAsset Contact", email: "scasset@example.test", phone: "+66-80-000-0601", title: "Contact", lineUserId: null },
  { id: "ct_pf", companyId: "co_pf", name: "PropertyPerfect Contact", email: "propertyperfect@example.test", phone: "+66-80-000-0602", title: "Contact", lineUserId: null },
];

type LeadSeed = {
  id: string;
  title: string;
  companyId: string;
  contactId: string;
  ownerId: string;
  stage: LeadStage;
  source: LeadSource;
  valueThb: number;
  lostReason?: string;
  createdAt: string;
};

const leads: LeadSeed[] = [
  {
    id: "lead_harbor_tracking",
    title: "Mall member experience",
    companyId: "co_themall",
    contactId: "ct_themall",
    ownerId: "user_anna",
    stage: "NEW",
    source: "WEBSITE",
    valueThb: 180000,
    createdAt: "2026-11-01T02:00:00.000Z",
  },
  {
    id: "lead_harbor_vendor",
    title: "Hypermarket vendor rollout",
    companyId: "co_bigc",
    contactId: "ct_bigc",
    ownerId: "user_anna",
    stage: "QUALIFIED",
    source: "MANUAL",
    valueThb: 95000,
    createdAt: "2026-10-20T03:30:00.000Z",
  },
  {
    id: "lead_foods_line",
    title: "Trade promotion workflow",
    companyId: "co_oishi",
    contactId: "ct_oishi",
    ownerId: "user_anna",
    stage: "QUALIFIED",
    source: "LINE",
    valueThb: 240000,
    createdAt: "2026-10-28T04:15:00.000Z",
  },
  {
    id: "lead_foods_qa",
    title: "Product quality dashboard",
    companyId: "co_meiji",
    contactId: "ct_meiji",
    ownerId: "user_erik",
    stage: "NEW",
    source: "WEBSITE",
    valueThb: 120000,
    createdAt: "2026-11-10T06:00:00.000Z",
  },
  {
    id: "lead_clinic_intake",
    title: "Visitor experience program",
    companyId: "co_tat",
    contactId: "ct_tat",
    ownerId: "user_erik",
    stage: "PROPOSAL",
    source: "WEBSITE",
    valueThb: 310000,
    createdAt: "2026-10-12T01:45:00.000Z",
  },
  {
    id: "lead_learning_lms",
    title: "Digital service desk",
    companyId: "co_etda",
    contactId: "ct_etda",
    ownerId: "user_anna",
    stage: "NEW",
    source: "MANUAL",
    valueThb: 70000,
    createdAt: "2026-11-08T08:20:00.000Z",
  },
  {
    id: "lead_stay_booking",
    title: "Project sales desk",
    companyId: "co_scasset",
    contactId: "ct_scasset",
    ownerId: "user_anna",
    stage: "WON",
    source: "WEBSITE",
    valueThb: 150000,
    createdAt: "2026-09-15T02:10:00.000Z",
  },
  {
    id: "lead_parts_rfq",
    title: "Policy inbox cleanup",
    companyId: "co_bki",
    contactId: "ct_bki",
    ownerId: "user_erik",
    stage: "LOST",
    source: "MANUAL",
    valueThb: 80000,
    lostReason: "Budget frozen until next fiscal year",
    createdAt: "2026-09-02T07:00:00.000Z",
  },
  {
    id: "lead_retail_stores",
    title: "Store visit checklist",
    companyId: "co_cpall",
    contactId: "ct_cpall",
    ownerId: "user_anna",
    stage: "PROPOSAL",
    source: "WEBSITE",
    valueThb: 275000,
    createdAt: "2026-10-18T09:40:00.000Z",
  },
  {
    id: "lead_brokers_renewal",
    title: "Renewal reminder desk",
    companyId: "co_muangthai",
    contactId: "ct_muangthai",
    ownerId: "user_erik",
    stage: "QUALIFIED",
    source: "MANUAL",
    valueThb: 64000,
    createdAt: "2026-11-03T05:05:00.000Z",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.company.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.user.createMany({
    data: users.map((user, index) => ({
      ...user,
      passwordHash,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
    })),
  });
  await prisma.company.createMany({ data: companies });
  await prisma.contact.createMany({ data: contacts });
  await prisma.lead.createMany({
    data: leads.map((lead) => ({
      ...lead,
      createdAt: new Date(lead.createdAt),
      updatedAt: new Date(lead.createdAt),
    })),
  });

  await prisma.activity.createMany({
    data: [
      {
        id: "act_harbor_created",
        leadId: "lead_harbor_tracking",
        actorId: "user_anna",
        type: "SYSTEM",
        body: "Lead created from the website form.",
        createdAt: new Date("2026-11-01T02:00:00.000Z"),
      },
      {
        id: "act_harbor_note",
        leadId: "lead_harbor_vendor",
        actorId: "user_anna",
        type: "NOTE",
        body: "BigC Contact asked for a one-page scope before involving finance.",
        createdAt: new Date("2026-10-22T04:00:00.000Z"),
      },
      {
        id: "act_harbor_stage",
        leadId: "lead_harbor_vendor",
        actorId: "user_anna",
        type: "STAGE_CHANGE",
        body: "Stage changed from New to Qualified.",
        metadata: { from: "NEW", to: "QUALIFIED" },
        createdAt: new Date("2026-10-22T04:05:00.000Z"),
      },
      {
        id: "act_foods_created",
        leadId: "lead_foods_line",
        actorId: "user_anna",
        type: "SYSTEM",
        body: "Lead opened from a LINE Official Account conversation.",
        createdAt: new Date("2026-10-28T04:15:00.000Z"),
      },
      {
        id: "act_foods_stage",
        leadId: "lead_foods_line",
        actorId: "user_anna",
        type: "STAGE_CHANGE",
        body: "Stage changed from New to Qualified.",
        metadata: { from: "NEW", to: "QUALIFIED" },
        createdAt: new Date("2026-11-02T03:00:00.000Z"),
      },
      {
        id: "act_clinic_note",
        leadId: "lead_clinic_intake",
        actorId: "user_erik",
        type: "NOTE",
        body: "Proposal sent. Waiting on the agency review.",
        createdAt: new Date("2026-11-06T02:30:00.000Z"),
      },
      {
        id: "act_parts_lost",
        leadId: "lead_parts_rfq",
        actorId: "user_erik",
        type: "STAGE_CHANGE",
        body: "Stage changed from Qualified to Lost. Budget frozen until next fiscal year.",
        metadata: { from: "QUALIFIED", to: "LOST" },
        createdAt: new Date("2026-10-01T08:00:00.000Z"),
      },
      {
        id: "act_stay_won",
        leadId: "lead_stay_booking",
        actorId: "user_anna",
        type: "STAGE_CHANGE",
        body: "Stage changed from Proposal to Won.",
        metadata: { from: "PROPOSAL", to: "WON" },
        createdAt: new Date("2026-10-30T06:45:00.000Z"),
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        id: "msg_foods_in",
        leadId: "lead_foods_line",
        contactId: "ct_oishi",
        channel: "LINE",
        direction: "INBOUND",
        status: "RECEIVED",
        body: "Can you send a short plan for the promotion workflow? We need it before Friday.",
        externalId: "line-msg-demo-0001",
        replyToken: "demo-reply-token-not-live",
        createdAt: new Date("2026-11-12T01:20:00.000Z"),
      },
      {
        id: "msg_foods_draft",
        leadId: "lead_foods_line",
        contactId: "ct_oishi",
        channel: "LINE",
        direction: "OUTBOUND",
        status: "DRAFT",
        body: "Thanks Oishi Contact. I will send a one-page plan tomorrow covering the Friday deadline, owners, and what we still need from your team.",
        idempotencyKey: "draft-foods-line-1",
        createdAt: new Date("2026-11-12T01:35:00.000Z"),
      },
      {
        id: "msg_clinic_in",
        leadId: "lead_clinic_intake",
        contactId: "ct_tat",
        channel: "LINE",
        direction: "INBOUND",
        status: "RECEIVED",
        body: "Please keep personal data out of the demo. A workflow summary is enough.",
        externalId: "line-msg-demo-0002",
        createdAt: new Date("2026-11-07T09:10:00.000Z"),
      },
    ],
  });

  const [userCount, companyCount, contactCount, leadCount, activityCount, messageCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.contact.count(),
      prisma.lead.count(),
      prisma.activity.count(),
      prisma.message.count(),
    ]);

  console.log(
    JSON.stringify({
      users: userCount,
      companies: companyCount,
      contacts: contactCount,
      leads: leadCount,
      activities: activityCount,
      messages: messageCount,
    }),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
