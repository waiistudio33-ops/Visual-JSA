// src/data/jsaTemplateData.ts

export interface JsaTemplateItem {
  id: string;
  category: string;
  jobStep: string;
  equipment: string;
  potentialHazard: string;
  consequence: string;
  initialL: number; // Likelihood (1-5)
  initialS: number; // Severity (1-5)
  controlMeasures: string;
  criticalVerification: string;
  residualL: number;
  residualS: number;
}

export const jsaTemplates: JsaTemplateItem[] = [
  {
    id: 't-1',
    category: 'งานโครงสร้างเหล็ก-เสา',
    jobStep: 'ยกเสาเหล็กด้วยรถเครน (Lifting Steel Column)',
    equipment: 'Mobile Crane, ลวดสลิง, Tag Line',
    potentialHazard: 'เสาเหล็กแกว่งหรือหลุดตก เครนรับน้ำหนักเกิน หรือมีคนอยู่ในเขตยก[cite: 1]',
    consequence: 'ถูกเสาเหล็กกระแทก/ทับ บาดเจ็บสาหัสหรือเสียชีวิต[cite: 1]',
    initialL: 4,
    initialS: 5, // Score = 20 (Extreme/Critical)[cite: 1]
    controlMeasures: '• ตรวจสอบเครนและอุปกรณ์ยก \n• กำหนดเขตห้ามเข้า (Exclusion Zone) \n• ใช้เชือกควบคุมการแกว่ง (Tag Line) \n• มีผู้ให้สัญญาณเครนคนเดียว[cite: 1]',
    criticalVerification: 'ตรวจเอกสาร/สภาพเครน, ตรวจอุปกรณ์ยก, ตรวจเขตกั้นก่อนยก[cite: 1]',
    residualL: 2,
    residualS: 5, // Residual Score = 10 (High)[cite: 1]
  },
  {
    id: 't-2',
    category: 'งานโครงสร้างเหล็ก-คาน/หลังคา',
    jobStep: 'เตรียมและผูกยึดคาน/โครงหลังคาสำหรับยก',
    equipment: 'Mobile Crane, Wire rope sling, Bow Shackle[cite: 1]',
    potentialHazard: 'การผูกยึดสลิงไม่ถูกต้อง / สลิงหรือสเก็นชำรุดรับน้ำหนักเกิน[cite: 1]',
    consequence: 'คาน/โครงหลังคาหลุดตกหรือแกว่งกระแทก บาดเจ็บรุนแรง/เสียชีวิต[cite: 1]',
    initialL: 4,
    initialS: 5, // Score = 20[cite: 1]
    controlMeasures: '• ตรวจสภาพสลิงและสเก็นก่อนใช้งาน \n• เลือกอุปกรณ์ WLL/SWL เหมาะสมกับน้ำหนัก \n• ตรวจสอบจุดศูนย์ถ่วงและความสมดุล[cite: 1]',
    criticalVerification: 'ตรวจสภาพสลิง/สเก็น, ทดลองยกให้พ้นพื้นเล็กน้อยเพื่อตรวจสมดุล[cite: 1]',
    residualL: 1,
    residualS: 5, // Residual Score = 5 (Medium)[cite: 1]
  },
  {
    id: 't-3',
    category: 'งานหลังคาและฉนวน',
    jobStep: 'ขนส่งและติดตั้งแผ่นหลังคาบนที่สูง (Roofing Installation)',
    equipment: 'Cordless Screw Gun, Material Hoist, Lifeline',
    potentialHazard: 'พลัดตกจากขอบหลังคาหรือช่องเปิดขณะเดินขนวัสดุ / แผ่นหลังคาปลิว[cite: 1]',
    consequence: 'บาดเจ็บสาหัสหรือเสียชีวิตจากการตกจากที่สูง[cite: 1]',
    initialL: 4,
    initialS: 5, // Score = 20[cite: 1]
    controlMeasures: '• สวมชุดฮาร์เนสเต็มตัวพร้อมสายช่วยชีวิตคู่ (Double Lanyard) คล้องกับ Lifeline ตลอดเวลา \n• ติดตั้งตาข่ายนิรภัย (Safety Net) \n• ตรวจสอบความเร็วลมไม่เกินกำหนด[cite: 1]',
    criticalVerification: 'ผู้เชี่ยวชาญตรวจสอบจุดยึด Anchor Point/Lifeline ก่อนใช้งาน 100%[cite: 1]',
    residualL: 2,
    residualS: 5, // Residual Score = 10 (High)[cite: 1]
  }
];