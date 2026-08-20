// src/data/mockJsaData.ts
import type { JsaData } from '../types/jsa';

export const initialJsaData: JsaData[] = [
  {
    id: '1',
    jsaNo: 'JSA-ST-001',
    jobStep: 'ยกเสาเหล็กด้วยรถเครน', //[cite: 1]  
    equipment: 'Mobile Crane, ลวดสลิง, Tag Line', //[cite: 1]
    potentialHazard: 'เสาเหล็กแกว่งหรือหลุดตก เครนรับน้ำหนักเกิน', //[cite: 1]
    consequence: 'ถูกเสาเหล็กกระแทก/ทับ บาดเจ็บสาหัสหรือเสียชีวิต', //[cite: 1]
    initialRisk: 20, // 4L x 5S[cite: 1]
    riskLevel: 'CRITICAL',
    controlMeasures: 'กำหนดเขตห้ามเข้า ใช้เชือกควบคุมการแกว่ง (Tag line) ห้ามยกเกินพิกัด', //[cite: 1]
    lat: 12.6730,
    lng: 101.1518,
    area: 'Zone A (Structural)',
    simops: false,
    simopsDetail: ''
  },
  {
    id: '2',
    jsaNo: 'JSA-RF-001',
    jobStep: 'ติดตั้งครอบสันหลังคา/Flashings', //[cite: 1]
    equipment: 'ปืนยิงซิลิโคน, หมุดยึด', //[cite: 1]
    potentialHazard: 'พลัดตกขณะทำงานบริเวณสันหลังคา', //[cite: 1]
    consequence: 'บาดเจ็บสาหัสหรือเสียชีวิตจากการตกจากที่สูง', //[cite: 1]
    initialRisk: 15, // 3L x 5S[cite: 1]
    riskLevel: 'HIGH',
    controlMeasures: 'คล้องฮาร์เนสกับ Anchor Point บริเวณสันหลังคาตลอดเวลาทำงาน', //[cite: 1]
    lat: 12.6605,
    lng: 101.1560,
    area: 'Zone B (Roofing)',
    simops: false,
    simopsDetail: ''
  },
  {
    id: '3',
    jsaNo: 'JSA-ST-002',
    jobStep: 'เทปูนรองฐานเสาเหล็ก', //[cite: 1]
    equipment: 'เครื่องผสมปูน, พลั่ว, เกรียง', //[cite: 1]
    potentialHazard: 'ปูนซีเมนต์สัมผัสผิวหนัง/ดวงตา พื้นเปียกลื่น', //[cite: 1]
    consequence: 'ผิวหนังระคายเคือง ปูนเข้าตา ลื่นหกล้ม', //[cite: 1]
    initialRisk: 9, // 3L x 3S[cite: 1]
    riskLevel: 'MEDIUM',
    controlMeasures: 'สวมถุงมือ แว่นตานิรภัย รองเท้านิรภัย จัดพื้นที่ให้แห้งและสะอาด', //[cite: 1]
    lat: 12.6725,
    lng: 101.1510,
    area: 'Zone A (Structural)',
    simops: false,
    simopsDetail: ''
  }
];