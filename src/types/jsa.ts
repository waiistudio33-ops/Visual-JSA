// src/types/jsa.ts

export interface JsaData {
  id: string;
  jsaNo: string;
  jobStep: string; // ขั้นตอนการทำงาน
  equipment: string; // เครื่องมือ/อุปกรณ์
  potentialHazard: string; // อันตรายที่อาจเกิดขึ้น
  consequence: string; // ผลกระทบที่อาจเกิดขึ้น
  initialRisk: number; // ความเสี่ยงก่อนการควบคุม (Score)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  controlMeasures: string; // มาตรการควบคุมความเสี่ยง
  
  // พิกัดสำหรับแสดงบนแผนที่ (Innovation)
  lat: number;
  lng: number;
  area: string;
  
  // ระบบ SIMOPS (Innovation)
  simops: boolean;
  simopsDetail: string;

  // 🌟 เพิ่มฟิลด์สำหรับระบบ Workflow และตัวกรอง
  status?: 'PENDING' | 'VERIFIED' | 'APPROVED'; // สถานะงาน
  high_risk_tags?: string[]; // ประเภทงาน (Tag)
  created_at?: string; // 🌟 วันที่สร้าง (สำหรับตัวกรองเวลา)
}