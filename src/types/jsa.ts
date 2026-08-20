// src/types/jsa.ts

export interface JsaData {
  id: string;
  jsaNo: string;
  jobStep: string;
  equipment: string;
  potentialHazard: string;
  consequence: string;
  initialRisk: number;
  riskLevel: string;
  controlMeasures: string;
  lat: number;
  lng: number;
  area: string;
  status?: string;
  created_at?: string;
  
  // Tags & SIMOPS
  high_risk_tags?: string[];
  simops?: boolean;
  simopsDetail?: string;
  liftingEquipment?: string;
  
  // 🌟 ส่วนที่ต้องเพิ่มเข้าไปใหม่ (ระบบคะแนน Risk Score) 🌟
  likelihood?: number;
  severity?: number;
  risk_score?: number;
  verification?: string;
  residual_likelihood?: number;
  residual_severity?: number;
  residual_risk_score?: number;
}