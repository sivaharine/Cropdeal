import {
  CropResponse, BiddingSessionResponse, OrderResponse,
  PaymentResponse, MarketPriceResponse, FarmerReviewResponse,
  DeliveryResponse, InvoiceResponse, NegotiationResponse
} from '../models/models';

export const MOCK_CROPS: CropResponse[] = [
  {
    id: 101,
    farmerId: 1,
    commodity: 'Basmati Rice',
    state: 'Punjab',
    district: 'Amritsar',
    grade: 'A',
    quantity: 5000,
    unit: 'KG',
    pricePerKg: 85.00,
    description: 'Premium export quality aromatic 1121 steam Basmati Rice with 8.4mm grain length.',
    status: 'ACTIVE',
    createdAt: '2026-09-20T10:00:00',
    updatedAt: '2026-09-20T10:00:00'
  },
  {
    id: 102,
    farmerId: 1,
    commodity: 'Wheat (Sharbati)',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    grade: 'A',
    quantity: 8000,
    unit: 'KG',
    pricePerKg: 38.50,
    description: 'Golden Sharbati wheat, highest protein content, organically harvested with zero pesticides.',
    status: 'ACTIVE',
    createdAt: '2026-09-22T08:30:00',
    updatedAt: '2026-09-22T08:30:00'
  },
  {
    id: 103,
    farmerId: 2,
    commodity: 'Cotton (MCU-5)',
    state: 'Gujarat',
    district: 'Rajkot',
    grade: 'B',
    quantity: 3500,
    unit: 'KG',
    pricePerKg: 72.00,
    description: 'Long staple lint cotton, moisture below 7%, suitable for high-count textile spinning.',
    status: 'ACTIVE',
    createdAt: '2026-09-23T11:15:00',
    updatedAt: '2026-09-23T11:15:00'
  },
  {
    id: 104,
    farmerId: 3,
    commodity: 'Soyabean',
    state: 'Maharashtra',
    district: 'Nagpur',
    grade: 'A',
    quantity: 4200,
    unit: 'KG',
    pricePerKg: 52.00,
    description: 'Yellow soyabean seed with high oil content (19%) and protein (41%). Cleaned & graded.',
    status: 'ACTIVE',
    createdAt: '2026-09-24T14:20:00',
    updatedAt: '2026-09-24T14:20:00'
  },
  {
    id: 105,
    farmerId: 1,
    commodity: 'Red Onion (Nashik)',
    state: 'Maharashtra',
    district: 'Nashik',
    grade: 'A',
    quantity: 12000,
    unit: 'KG',
    pricePerKg: 26.50,
    description: 'Fresh Nashik red onions, medium-to-large 55mm+ bulbs, excellent shelf life 90 days.',
    status: 'ACTIVE',
    createdAt: '2026-09-25T09:00:00',
    updatedAt: '2026-09-25T09:00:00'
  },
  {
    id: 106,
    farmerId: 2,
    commodity: 'Potato (Kufri Jyoti)',
    state: 'Uttar Pradesh',
    district: 'Agra',
    grade: 'B',
    quantity: 15000,
    unit: 'KG',
    pricePerKg: 19.00,
    description: 'Freshly dug cold-stored table potato. Smooth surface, minimal sugar content.',
    status: 'ACTIVE',
    createdAt: '2026-09-26T16:45:00',
    updatedAt: '2026-09-26T16:45:00'
  }
];

export const MOCK_PRICES: MarketPriceResponse[] = [
  { id: 1,  commodity: 'Basmati Rice',      state: 'Punjab',          district: 'Amritsar',    grade: 'A', minPrice: 8000, maxPrice: 9200, modalPrice: 8600, minPricePerKg: 80.0,  maxPricePerKg: 92.0,  modalPricePerKg: 86.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 2,  commodity: 'Wheat',             state: 'Madhya Pradesh',  district: 'Sehore',      grade: 'A', minPrice: 2800, maxPrice: 3200, modalPrice: 2950, minPricePerKg: 28.0,  maxPricePerKg: 32.0,  modalPricePerKg: 29.5,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 3,  commodity: 'Cotton',            state: 'Gujarat',         district: 'Rajkot',      grade: 'B', minPrice: 6800, maxPrice: 7600, modalPrice: 7200, minPricePerKg: 68.0,  maxPricePerKg: 76.0,  modalPricePerKg: 72.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 4,  commodity: 'Soyabean',          state: 'Maharashtra',     district: 'Nagpur',      grade: 'A', minPrice: 4800, maxPrice: 5400, modalPrice: 5150, minPricePerKg: 48.0,  maxPricePerKg: 54.0,  modalPricePerKg: 51.5,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 5,  commodity: 'Onion',             state: 'Maharashtra',     district: 'Nashik',      grade: 'A', minPrice: 2200, maxPrice: 2900, modalPrice: 2600, minPricePerKg: 22.0,  maxPricePerKg: 29.0,  modalPricePerKg: 26.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 6,  commodity: 'Potato',            state: 'Uttar Pradesh',   district: 'Agra',        grade: 'B', minPrice: 1200, maxPrice: 1800, modalPrice: 1500, minPricePerKg: 12.0,  maxPricePerKg: 18.0,  modalPricePerKg: 15.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 7,  commodity: 'Tomato',            state: 'Karnataka',       district: 'Kolar',       grade: 'A', minPrice: 3500, maxPrice: 5200, modalPrice: 4400, minPricePerKg: 35.0,  maxPricePerKg: 52.0,  modalPricePerKg: 44.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 8,  commodity: 'Mustard Seeds',     state: 'Rajasthan',       district: 'Alwar',       grade: 'A', minPrice: 5600, maxPrice: 6200, modalPrice: 5900, minPricePerKg: 56.0,  maxPricePerKg: 62.0,  modalPricePerKg: 59.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 9,  commodity: 'Maize',             state: 'Bihar',           district: 'Muzaffarpur', grade: 'B', minPrice: 2100, maxPrice: 2500, modalPrice: 2300, minPricePerKg: 21.0,  maxPricePerKg: 25.0,  modalPricePerKg: 23.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 10, commodity: 'Turmeric',          state: 'Telangana',       district: 'Nizamabad',   grade: 'A', minPrice: 14000,maxPrice: 17000,modalPrice: 15500,minPricePerKg: 140.0, maxPricePerKg: 170.0, modalPricePerKg: 155.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 11, commodity: 'Chilli (Dry)',      state: 'Andhra Pradesh',  district: 'Guntur',      grade: 'A', minPrice: 16000,maxPrice: 22000,modalPrice: 19000,minPricePerKg: 160.0, maxPricePerKg: 220.0, modalPricePerKg: 190.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 12, commodity: 'Groundnut',         state: 'Gujarat',         district: 'Junagadh',    grade: 'B', minPrice: 5500, maxPrice: 6500, modalPrice: 6000, minPricePerKg: 55.0,  maxPricePerKg: 65.0,  modalPricePerKg: 60.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 13, commodity: 'Arhar Dal (Tur)',   state: 'Maharashtra',     district: 'Latur',       grade: 'A', minPrice: 6800, maxPrice: 7800, modalPrice: 7300, minPricePerKg: 68.0,  maxPricePerKg: 78.0,  modalPricePerKg: 73.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 14, commodity: 'Green Gram (Moong)',state: 'Rajasthan',       district: 'Jodhpur',     grade: 'A', minPrice: 7000, maxPrice: 8200, modalPrice: 7600, minPricePerKg: 70.0,  maxPricePerKg: 82.0,  modalPricePerKg: 76.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 15, commodity: 'Black Gram (Urad)', state: 'Uttar Pradesh',   district: 'Etawah',      grade: 'A', minPrice: 6500, maxPrice: 7500, modalPrice: 7000, minPricePerKg: 65.0,  maxPricePerKg: 75.0,  modalPricePerKg: 70.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 16, commodity: 'Chickpea (Chana)',  state: 'Madhya Pradesh',  district: 'Indore',      grade: 'A', minPrice: 5200, maxPrice: 6000, modalPrice: 5600, minPricePerKg: 52.0,  maxPricePerKg: 60.0,  modalPricePerKg: 56.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 17, commodity: 'Lentil (Masoor)',   state: 'Madhya Pradesh',  district: 'Bhopal',      grade: 'B', minPrice: 5000, maxPrice: 5800, modalPrice: 5400, minPricePerKg: 50.0,  maxPricePerKg: 58.0,  modalPricePerKg: 54.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 18, commodity: 'Sunflower Seeds',   state: 'Karnataka',       district: 'Dharwad',     grade: 'A', minPrice: 5800, maxPrice: 6600, modalPrice: 6200, minPricePerKg: 58.0,  maxPricePerKg: 66.0,  modalPricePerKg: 62.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 19, commodity: 'Sesame (Til)',       state: 'Gujarat',         district: 'Surat',       grade: 'A', minPrice: 11000,maxPrice: 14000,modalPrice: 12500,minPricePerKg: 110.0, maxPricePerKg: 140.0, modalPricePerKg: 125.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 20, commodity: 'Jowar',             state: 'Maharashtra',     district: 'Solapur',     grade: 'B', minPrice: 2600, maxPrice: 3200, modalPrice: 2900, minPricePerKg: 26.0,  maxPricePerKg: 32.0,  modalPricePerKg: 29.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 21, commodity: 'Bajra',             state: 'Rajasthan',       district: 'Barmer',      grade: 'B', minPrice: 2200, maxPrice: 2700, modalPrice: 2450, minPricePerKg: 22.0,  maxPricePerKg: 27.0,  modalPricePerKg: 24.5,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 22, commodity: 'Sugarcane',         state: 'Uttar Pradesh',   district: 'Muzaffarnagar',grade:'A', minPrice: 350,  maxPrice: 400,  modalPrice: 375,  minPricePerKg: 3.5,   maxPricePerKg: 4.0,   modalPricePerKg: 3.75,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 23, commodity: 'Ginger',            state: 'Kerala',          district: 'Wayanad',     grade: 'A', minPrice: 15000,maxPrice: 20000,modalPrice: 17500,minPricePerKg: 150.0, maxPricePerKg: 200.0, modalPricePerKg: 175.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 24, commodity: 'Garlic',            state: 'Madhya Pradesh',  district: 'Mandsaur',    grade: 'A', minPrice: 8000, maxPrice: 12000,modalPrice: 10000,minPricePerKg: 80.0,  maxPricePerKg: 120.0, modalPricePerKg: 100.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 25, commodity: 'Brinjal',           state: 'Tamil Nadu',      district: 'Salem',       grade: 'B', minPrice: 1800, maxPrice: 3000, modalPrice: 2400, minPricePerKg: 18.0,  maxPricePerKg: 30.0,  modalPricePerKg: 24.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 26, commodity: 'Cabbage',           state: 'Himachal Pradesh',district: 'Kullu',       grade: 'A', minPrice: 1500, maxPrice: 2200, modalPrice: 1850, minPricePerKg: 15.0,  maxPricePerKg: 22.0,  modalPricePerKg: 18.5,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 27, commodity: 'Cauliflower',       state: 'Punjab',          district: 'Ludhiana',    grade: 'A', minPrice: 2000, maxPrice: 2800, modalPrice: 2400, minPricePerKg: 20.0,  maxPricePerKg: 28.0,  modalPricePerKg: 24.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 28, commodity: 'Capsicum',          state: 'Maharashtra',     district: 'Pune',        grade: 'A', minPrice: 4000, maxPrice: 6000, modalPrice: 5000, minPricePerKg: 40.0,  maxPricePerKg: 60.0,  modalPricePerKg: 50.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 29, commodity: 'Okra (Bhindi)',     state: 'Andhra Pradesh',  district: 'Vijayawada',  grade: 'B', minPrice: 2800, maxPrice: 4200, modalPrice: 3500, minPricePerKg: 28.0,  maxPricePerKg: 42.0,  modalPricePerKg: 35.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 30, commodity: 'Carrot',            state: 'Haryana',         district: 'Karnal',      grade: 'A', minPrice: 2000, maxPrice: 3000, modalPrice: 2500, minPricePerKg: 20.0,  maxPricePerKg: 30.0,  modalPricePerKg: 25.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 31, commodity: 'Radish',            state: 'Punjab',          district: 'Patiala',     grade: 'B', minPrice: 1000, maxPrice: 1800, modalPrice: 1400, minPricePerKg: 10.0,  maxPricePerKg: 18.0,  modalPricePerKg: 14.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 32, commodity: 'Bitter Gourd',      state: 'West Bengal',     district: 'Hooghly',     grade: 'B', minPrice: 3000, maxPrice: 4500, modalPrice: 3800, minPricePerKg: 30.0,  maxPricePerKg: 45.0,  modalPricePerKg: 38.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 33, commodity: 'Bottle Gourd',      state: 'Bihar',           district: 'Patna',       grade: 'B', minPrice: 1200, maxPrice: 2000, modalPrice: 1600, minPricePerKg: 12.0,  maxPricePerKg: 20.0,  modalPricePerKg: 16.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 34, commodity: 'Banana',            state: 'Tamil Nadu',      district: 'Trichy',      grade: 'A', minPrice: 1500, maxPrice: 2200, modalPrice: 1800, minPricePerKg: 15.0,  maxPricePerKg: 22.0,  modalPricePerKg: 18.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 35, commodity: 'Mango',             state: 'Andhra Pradesh',  district: 'Krishna',     grade: 'A', minPrice: 3500, maxPrice: 5500, modalPrice: 4500, minPricePerKg: 35.0,  maxPricePerKg: 55.0,  modalPricePerKg: 45.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 36, commodity: 'Papaya',            state: 'Maharashtra',     district: 'Jalgaon',     grade: 'B', minPrice: 1200, maxPrice: 2000, modalPrice: 1600, minPricePerKg: 12.0,  maxPricePerKg: 20.0,  modalPricePerKg: 16.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 37, commodity: 'Pomegranate',       state: 'Maharashtra',     district: 'Solapur',     grade: 'A', minPrice: 8000, maxPrice: 12000,modalPrice: 10000,minPricePerKg: 80.0,  maxPricePerKg: 120.0, modalPricePerKg: 100.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 38, commodity: 'Guava',             state: 'Uttar Pradesh',   district: 'Allahabad',   grade: 'B', minPrice: 2000, maxPrice: 3500, modalPrice: 2750, minPricePerKg: 20.0,  maxPricePerKg: 35.0,  modalPricePerKg: 27.5,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 39, commodity: 'Lemon',             state: 'Andhra Pradesh',  district: 'Nellore',     grade: 'A', minPrice: 4000, maxPrice: 7000, modalPrice: 5500, minPricePerKg: 40.0,  maxPricePerKg: 70.0,  modalPricePerKg: 55.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 40, commodity: 'Coconut',           state: 'Kerala',          district: 'Thrissur',    grade: 'A', minPrice: 1800, maxPrice: 2500, modalPrice: 2100, minPricePerKg: 18.0,  maxPricePerKg: 25.0,  modalPricePerKg: 21.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 41, commodity: 'Cashew Nuts',       state: 'Goa',             district: 'Panaji',      grade: 'A', minPrice: 60000,maxPrice: 80000,modalPrice: 70000,minPricePerKg: 600.0, maxPricePerKg: 800.0, modalPricePerKg: 700.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 42, commodity: 'Groundnut Oil',     state: 'Gujarat',         district: 'Ahmedabad',   grade: 'A', minPrice: 13000,maxPrice: 15000,modalPrice: 14000,minPricePerKg: 130.0, maxPricePerKg: 150.0, modalPricePerKg: 140.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 43, commodity: 'Rapeseed',          state: 'West Bengal',     district: 'Murshidabad', grade: 'B', minPrice: 5000, maxPrice: 6000, modalPrice: 5500, minPricePerKg: 50.0,  maxPricePerKg: 60.0,  modalPricePerKg: 55.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 44, commodity: 'Linseed',           state: 'Uttar Pradesh',   district: 'Kanpur',      grade: 'B', minPrice: 6000, maxPrice: 7200, modalPrice: 6600, minPricePerKg: 60.0,  maxPricePerKg: 72.0,  modalPricePerKg: 66.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 45, commodity: 'Horse Gram',        state: 'Tamil Nadu',      district: 'Madurai',     grade: 'B', minPrice: 6000, maxPrice: 7500, modalPrice: 6800, minPricePerKg: 60.0,  maxPricePerKg: 75.0,  modalPricePerKg: 68.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 46, commodity: 'Fenugreek',         state: 'Rajasthan',       district: 'Jaipur',      grade: 'A', minPrice: 6500, maxPrice: 8000, modalPrice: 7200, minPricePerKg: 65.0,  maxPricePerKg: 80.0,  modalPricePerKg: 72.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 47, commodity: 'Spinach',           state: 'Delhi',           district: 'Azadpur',     grade: 'B', minPrice: 1500, maxPrice: 2500, modalPrice: 2000, minPricePerKg: 15.0,  maxPricePerKg: 25.0,  modalPricePerKg: 20.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 48, commodity: 'Rice (Non-Basmati)',state: 'West Bengal',     district: 'Hooghly',     grade: 'B', minPrice: 3200, maxPrice: 3800, modalPrice: 3500, minPricePerKg: 32.0,  maxPricePerKg: 38.0,  modalPricePerKg: 35.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 49, commodity: 'Peas (Green)',      state: 'Punjab',          district: 'Hoshiarpur',  grade: 'A', minPrice: 3500, maxPrice: 5000, modalPrice: 4200, minPricePerKg: 35.0,  maxPricePerKg: 50.0,  modalPricePerKg: 42.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 50, commodity: 'Coriander Seeds',   state: 'Rajasthan',       district: 'Kota',        grade: 'A', minPrice: 7500, maxPrice: 9000, modalPrice: 8200, minPricePerKg: 75.0,  maxPricePerKg: 90.0,  modalPricePerKg: 82.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 51, commodity: 'Cumin Seeds',       state: 'Gujarat',         district: 'Unjha',       grade: 'A', minPrice: 18000,maxPrice: 24000,modalPrice: 21000,minPricePerKg: 180.0, maxPricePerKg: 240.0, modalPricePerKg: 210.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 52, commodity: 'Black Pepper',      state: 'Kerala',          district: 'Idukki',      grade: 'A', minPrice: 55000,maxPrice: 68000,modalPrice: 62000,minPricePerKg: 550.0, maxPricePerKg: 680.0, modalPricePerKg: 620.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 53, commodity: 'Cardamom',          state: 'Kerala',          district: 'Idukki',      grade: 'A', minPrice: 80000,maxPrice: 110000,modalPrice: 95000,minPricePerKg: 800.0,maxPricePerKg: 1100.0,modalPricePerKg: 950.0, arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 54, commodity: 'Watermelon',        state: 'Andhra Pradesh',  district: 'Kurnool',     grade: 'B', minPrice: 800,  maxPrice: 1500, modalPrice: 1100, minPricePerKg: 8.0,   maxPricePerKg: 15.0,  modalPricePerKg: 11.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 },
  { id: 55, commodity: 'Sweet Potato',      state: 'Odisha',          district: 'Cuttack',     grade: 'B', minPrice: 2000, maxPrice: 3000, modalPrice: 2500, minPricePerKg: 20.0,  maxPricePerKg: 30.0,  modalPricePerKg: 25.0,  arrivalDate: '2026-09-28', sourceUnit: 'Quintal', kgPerUnit: 100 }
];


export const MOCK_SESSIONS: BiddingSessionResponse[] = [
  {
    id: 201,
    cropId: 101,
    farmerId: 1,
    cropName: 'Basmati Rice Premium 1121',
    quantity: 2000,
    unit: 'KG',
    basePrice: 80.00,
    minIncrement: 2.00,
    currentHighestBid: 86.00,
    highestBidderId: 10,
    startTime: '2026-09-28T08:00:00',
    endTime: '2026-09-28T18:00:00',
    status: 'ACTIVE',
    district: 'Amritsar',
    state: 'Punjab',
    createdAt: '2026-09-28T07:30:00',
    updatedAt: '2026-09-28T10:15:00'
  },
  {
    id: 202,
    cropId: 102,
    farmerId: 1,
    cropName: 'Sharbati Organic Wheat Seed',
    quantity: 5000,
    unit: 'KG',
    basePrice: 35.00,
    minIncrement: 1.00,
    currentHighestBid: 39.00,
    highestBidderId: 12,
    startTime: '2026-09-28T09:00:00',
    endTime: '2026-09-28T20:00:00',
    status: 'ACTIVE',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    createdAt: '2026-09-28T08:00:00',
    updatedAt: '2026-09-28T10:45:00'
  }
];

export const MOCK_ORDERS: OrderResponse[] = [
  {
    id: 501,
    dealerId: 10,
    farmerId: 1,
    cropId: 101,
    cropName: 'Basmati Rice',
    quantity: 1000,
    unitPrice: 85.0,
    pricePerUnit: 85.0,
    totalAmount: 85000.0,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    deliveryAddress: 'Grain Merchant Yard, Sector 18, Mandi Road, Delhi',
    createdAt: '2026-09-27T10:30:00',
    updatedAt: '2026-09-27T11:00:00'
  },
  {
    id: 502,
    dealerId: 10,
    farmerId: 2,
    cropId: 103,
    cropName: 'Cotton (MCU-5)',
    quantity: 500,
    unitPrice: 72.0,
    pricePerUnit: 72.0,
    totalAmount: 36000.0,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    deliveryAddress: 'Sunrise Spinning Mills, Industrial Area, Ahmedabad',
    createdAt: '2026-09-28T09:15:00',
    updatedAt: '2026-09-28T09:15:00'
  }
];

export const MOCK_NEGOTIATIONS: NegotiationResponse[] = [
  {
    id: 401,
    cropId: 104,
    buyerId: 10,
    sellerId: 3,
    quantity: 2000,
    targetPrice: 49.00,
    status: 'OPEN',
    createdAt: '2026-09-28T08:30:00',
    updatedAt: '2026-09-28T09:20:00',
    offers: [
      {
        id: 1,
        negotiationId: 401,
        offeredByUserId: 10,
        amount: 49.00,
        message: 'Looking for bulk 2,000 KG deal. Can pay instant advance.',
        status: 'COUNTERED',
        createdAt: '2026-09-28T08:30:00'
      },
      {
        id: 2,
        negotiationId: 401,
        offeredByUserId: 3,
        amount: 51.00,
        message: 'Graded yellow soya best in region. Lowest acceptable price is Rs 51/KG.',
        status: 'PENDING',
        createdAt: '2026-09-28T09:20:00'
      }
    ]
  }
];

export const MOCK_DELIVERIES: DeliveryResponse[] = [
  {
    id: 601,
    orderId: 501,
    deliveryPartnerId: 5,
    status: 'IN_TRANSIT',
    pickupAddress: 'Farm Gate No. 4, GT Road, Amritsar, Punjab',
    deliveryAddress: 'Grain Merchant Yard, Sector 18, Mandi Road, Delhi',
    deliveryOtp: '4829',
    otpVerified: false,
    createdAt: '2026-09-27T12:00:00',
    updatedAt: '2026-09-28T08:00:00'
  }
];


export const MOCK_INVOICES: InvoiceResponse[] = [
  {
    id: 701,
    invoiceNumber: 'INV-2026-09001',
    orderId: 501,
    farmerId: 1,
    dealerId: 10,
    amount: 85000.0,
    taxAmount: 4250.0,
    totalAmount: 89250.0,
    status: 'PAID',
    createdAt: '2026-09-27T11:05:00'
  }
];

export const MOCK_REVIEWS: FarmerReviewResponse[] = [
  {
    id: 801,
    farmerId: 1,
    dealerId: 10,
    orderId: 501,
    cropId: 101,
    rating: 5,
    reviewText: 'Outstanding Basmati quality! Exact grain length as listed, aroma is authentic, and zero moisture issue. Will definitely buy regularly.',
    comment: 'Outstanding Basmati quality! Exact grain length as listed, aroma is authentic, and zero moisture issue. Will definitely buy regularly.',
    reviewReference: 'REV-801-BASMATI-1',
    status: 'APPROVED',
    dealerName: 'AgriTrade Procurement Hub',
    createdAt: '2026-09-27T15:30:00',
    updatedAt: '2026-09-27T15:30:00'
  },
  {
    id: 802,
    farmerId: 1,
    dealerId: 12,
    orderId: 503,
    cropId: 101,
    rating: 5,
    reviewText: 'Top-tier export grade 1121 Basmati. Packaging and bagging were immaculate at farm gate pickup.',
    comment: 'Top-tier export grade 1121 Basmati. Packaging and bagging were immaculate at farm gate pickup.',
    reviewReference: 'REV-802-BASMATI-2',
    status: 'APPROVED',
    dealerName: 'Punjab Grain Exporters',
    createdAt: '2026-09-28T11:20:00',
    updatedAt: '2026-09-28T11:20:00'
  },
  {
    id: 803,
    farmerId: 1,
    dealerId: 10,
    orderId: 504,
    cropId: 102,
    rating: 4,
    reviewText: 'Excellent Sharbati wheat grains, golden color and high luster. Flour yield was above 80%. Highly recommended.',
    comment: 'Excellent Sharbati wheat grains, golden color and high luster. Flour yield was above 80%. Highly recommended.',
    reviewReference: 'REV-803-WHEAT-1',
    status: 'APPROVED',
    dealerName: 'AgriTrade Procurement Hub',
    createdAt: '2026-09-28T14:15:00',
    updatedAt: '2026-09-28T14:15:00'
  },
  {
    id: 804,
    farmerId: 2,
    dealerId: 10,
    orderId: 502,
    cropId: 103,
    rating: 5,
    reviewText: 'Superior staple length on this MCU-5 Cotton. Lint cleanliness met mill standards. Prompt dispatch.',
    comment: 'Superior staple length on this MCU-5 Cotton. Lint cleanliness met mill standards. Prompt dispatch.',
    reviewReference: 'REV-804-COTTON-1',
    status: 'APPROVED',
    dealerName: 'Sunrise Spinning Mills',
    createdAt: '2026-09-28T17:00:00',
    updatedAt: '2026-09-28T17:00:00'
  },
  {
    id: 805,
    farmerId: 3,
    dealerId: 10,
    orderId: 505,
    cropId: 104,
    rating: 4,
    reviewText: 'Good oil-content in this Soyabean batch. Properly dried with minimal foreign matter.',
    comment: 'Good oil-content in this Soyabean batch. Properly dried with minimal foreign matter.',
    reviewReference: 'REV-805-SOYA-1',
    status: 'APPROVED',
    dealerName: 'Central Oilseed Traders',
    createdAt: '2026-09-29T10:45:00',
    updatedAt: '2026-09-29T10:45:00'
  },
  {
    id: 806,
    farmerId: 1,
    dealerId: 10,
    orderId: 506,
    cropId: 105,
    rating: 5,
    reviewText: 'Red Nashik Onions with firm bulb skin and great shelf life. Zero rot upon delivery.',
    comment: 'Red Nashik Onions with firm bulb skin and great shelf life. Zero rot upon delivery.',
    reviewReference: 'REV-806-ONION-1',
    status: 'APPROVED',
    dealerName: 'Mandi Vegetable Wholesalers',
    createdAt: '2026-09-29T12:00:00',
    updatedAt: '2026-09-29T12:00:00'
  },
  {
    id: 807,
    farmerId: 2,
    dealerId: 10,
    orderId: 507,
    cropId: 106,
    rating: 4,
    reviewText: 'Uniform size Kufri Jyoti potatoes. Crisp and ideal for commercial processing.',
    comment: 'Uniform size Kufri Jyoti potatoes. Crisp and ideal for commercial processing.',
    reviewReference: 'REV-807-POTATO-1',
    status: 'APPROVED',
    dealerName: 'Metro Food Corp',
    createdAt: '2026-09-29T13:30:00',
    updatedAt: '2026-09-29T13:30:00'
  }
];
