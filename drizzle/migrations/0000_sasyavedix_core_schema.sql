-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'Farmer',
  phone text,
  village text,
  district text,
  state text,
  land_acres numeric,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Farmer'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CROPS
CREATE TABLE public.crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL UNIQUE,
  name_hi text NOT NULL,
  category text NOT NULL DEFAULT 'cereal',
  season text NOT NULL DEFAULT 'Kharif',
  emoji text NOT NULL DEFAULT '🌱',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crops TO authenticated, anon;
GRANT ALL ON public.crops TO service_role;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crops readable" ON public.crops FOR SELECT TO authenticated, anon USING (true);

-- CROP VARIETIES
CREATE TABLE public.crop_varieties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop text NOT NULL,
  name_en text NOT NULL,
  name_hi text NOT NULL,
  duration_days int,
  yield_quintal_per_acre numeric,
  season text,
  water_need text,
  notes_en text,
  notes_hi text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crop_varieties TO authenticated, anon;
GRANT ALL ON public.crop_varieties TO service_role;
ALTER TABLE public.crop_varieties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "varieties readable" ON public.crop_varieties FOR SELECT TO authenticated, anon USING (true);

-- MARKET PRICES (historical, append only)
CREATE TABLE public.market_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop text NOT NULL,
  variety text,
  location text NOT NULL,
  market text NOT NULL,
  price numeric NOT NULL,
  unit text NOT NULL DEFAULT '₹/quintal',
  observed_on date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'sample_data',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX market_prices_crop_date_idx ON public.market_prices (crop, observed_on DESC);
GRANT SELECT ON public.market_prices TO authenticated, anon;
GRANT ALL ON public.market_prices TO service_role;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market readable" ON public.market_prices FOR SELECT TO authenticated, anon USING (true);

-- CROP LISTINGS (sell crop)
CREATE TABLE public.crop_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop text NOT NULL,
  variety text,
  quantity numeric NOT NULL,
  unit text NOT NULL DEFAULT 'quintal',
  expected_price numeric,
  location text NOT NULL,
  harvest_date date,
  quality_grade text DEFAULT 'A',
  image_url text,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_listings TO authenticated;
GRANT ALL ON public.crop_listings TO service_role;
ALTER TABLE public.crop_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own listings select" ON public.crop_listings FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "own listings insert" ON public.crop_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "own listings update" ON public.crop_listings FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "own listings delete" ON public.crop_listings FOR DELETE TO authenticated USING (auth.uid() = farmer_id);

-- CROP ANALYSIS
CREATE TABLE public.crop_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop text,
  image_url text,
  health_score int,
  status text,
  diagnosis text,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_price numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_analysis TO authenticated;
GRANT ALL ON public.crop_analysis TO service_role;
ALTER TABLE public.crop_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analysis select" ON public.crop_analysis FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "own analysis insert" ON public.crop_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "own analysis delete" ON public.crop_analysis FOR DELETE TO authenticated USING (auth.uid() = farmer_id);

-- GOVERNMENT SCHEMES
CREATE TABLE public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_hi text NOT NULL,
  description_en text NOT NULL,
  description_hi text NOT NULL,
  benefit text,
  eligibility text,
  category text NOT NULL DEFAULT 'subsidy',
  link text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schemes TO authenticated, anon;
GRANT ALL ON public.schemes TO service_role;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schemes readable" ON public.schemes FOR SELECT TO authenticated, anon USING (true);

-- SEED: crops
INSERT INTO public.crops (name_en, name_hi, category, season, emoji) VALUES
('Wheat','गेहूं','cereal','Rabi','🌾'),
('Rice','चावल','cereal','Kharif','🍚'),
('Maize','मक्का','cereal','Kharif','🌽'),
('Soybean','सोयाबीन','oilseed','Kharif','🫘'),
('Cotton','कपास','fibre','Kharif','🧵'),
('Sugarcane','गन्ना','cash','Annual','🎋'),
('Onion','प्याज','vegetable','Rabi','🧅'),
('Tomato','टमाटर','vegetable','Kharif','🍅'),
('Gram','चना','pulse','Rabi','🫛'),
('Mustard','सरसों','oilseed','Rabi','🌼');

-- SEED: varieties
INSERT INTO public.crop_varieties (crop, name_en, name_hi, duration_days, yield_quintal_per_acre, season, water_need, notes_en, notes_hi) VALUES
('Wheat','Sharbati','शरबती',125,18,'Rabi','Medium','Premium milling quality, high market demand.','उच्च बाजार मांग वाली प्रीमियम गुणवत्ता।'),
('Wheat','Lok-1','लोक-1',110,16,'Rabi','Low','Drought tolerant, suited to rainfed areas.','सूखा सहनशील, बारानी क्षेत्रों के लिए।'),
('Wheat','HD-2967','एचडी-2967',140,22,'Rabi','High','High yielding, rust resistant.','अधिक उपज, रतुआ प्रतिरोधी।'),
('Rice','Basmati 1121','बासमती 1121',145,15,'Kharif','High','Long grain export variety.','लंबा दाना, निर्यात किस्म।'),
('Rice','IR-64','आईआर-64',125,20,'Kharif','High','Widely grown, stable yields.','व्यापक रूप से उगाई जाने वाली।'),
('Maize','Pioneer 3396','पायनियर 3396',100,25,'Kharif','Medium','Hybrid with strong stalk.','मजबूत तना वाला संकर।'),
('Soybean','JS-9560','जेएस-9560',90,12,'Kharif','Low','Early maturing, good for MP region.','जल्दी पकने वाली, एमपी के लिए उपयुक्त।'),
('Cotton','Bt Cotton MRC-7017','बीटी कपास एमआरसी-7017',165,10,'Kharif','Medium','Bollworm resistant hybrid.','सुंडी प्रतिरोधी संकर।'),
('Onion','Nashik Red','नासिक लाल',120,90,'Rabi','Medium','Excellent storage life.','उत्कृष्ट भंडारण क्षमता।'),
('Tomato','Arka Rakshak','अर्का रक्षक',140,120,'Kharif','High','Triple disease resistant.','तीन रोगों के प्रति प्रतिरोधी।'),
('Gram','JG-11','जेजी-11',105,8,'Rabi','Low','Wilt resistant desi gram.','उकठा प्रतिरोधी देसी चना।'),
('Mustard','Pusa Bold','पूसा बोल्ड',125,9,'Rabi','Low','High oil content.','अधिक तेल मात्रा।'),
('Sugarcane','Co-0238','को-0238',360,350,'Annual','High','High sucrose, popular in UP.','अधिक शर्करा, यूपी में लोकप्रिय।');

-- SEED: schemes
INSERT INTO public.schemes (name_en, name_hi, description_en, description_hi, benefit, eligibility, category, link) VALUES
('PM-KISAN','पीएम-किसान','Income support of ₹6,000 per year to all landholding farmer families in three equal instalments.','सभी भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की आय सहायता, तीन किस्तों में।','₹6,000 / year','Landholding farmer families','income','https://pmkisan.gov.in'),
('Pradhan Mantri Fasal Bima Yojana','प्रधानमंत्री फसल बीमा योजना','Crop insurance against natural calamities, pests and diseases at low premium.','कम प्रीमियम पर प्राकृतिक आपदा, कीट और रोग के विरुद्ध फसल बीमा।','Up to full sum insured','All farmers growing notified crops','insurance','https://pmfby.gov.in'),
('Soil Health Card Scheme','मृदा स्वास्थ्य कार्ड योजना','Free soil testing and nutrient recommendations every two years.','हर दो वर्ष में मुफ्त मिट्टी परीक्षण और पोषक तत्व सिफारिशें।','Free soil testing','All farmers','advisory','https://soilhealth.dac.gov.in'),
('Kisan Credit Card','किसान क्रेडिट कार्ड','Short term credit for crop production at subsidised interest rates.','रियायती ब्याज दर पर फसल उत्पादन हेतु अल्पकालिक ऋण।','Loans at 4% effective interest','Farmers, tenant farmers, sharecroppers','credit','https://www.myscheme.gov.in'),
('PM Krishi Sinchayee Yojana','पीएम कृषि सिंचाई योजना','Micro irrigation subsidy for drip and sprinkler systems.','ड्रिप और स्प्रिंकलर प्रणाली के लिए सूक्ष्म सिंचाई सब्सिडी।','Up to 55% subsidy','Small and marginal farmers','subsidy','https://pmksy.gov.in'),
('e-NAM','ई-नाम','Online trading platform connecting mandis across India for better price discovery.','बेहतर मूल्य खोज के लिए देशभर की मंडियों को जोड़ने वाला ऑनलाइन व्यापार मंच।','Better mandi prices','Registered farmers and traders','market','https://enam.gov.in');

-- SEED: 60 days of market price history for key crop/mandi combinations
INSERT INTO public.market_prices (crop, variety, location, market, price, unit, observed_on, source)
SELECT c.crop, c.variety, c.location, c.market,
  ROUND((c.base * (1 + (sin(d * c.wave) * 0.06) + ((random() - 0.5) * 0.04)))::numeric, 0),
  '₹/quintal',
  (CURRENT_DATE - d),
  'sample_data'
FROM generate_series(0, 59) AS d,
(VALUES
  ('Wheat','Sharbati','Indore','Indore Mandi',2850::numeric,0.11::numeric),
  ('Wheat','HD-2967','Karnal','Karnal Mandi',2450,0.09),
  ('Rice','Basmati 1121','Karnal','Karnal Mandi',4200,0.13),
  ('Rice','IR-64','Raipur','Raipur Mandi',2180,0.10),
  ('Maize','Pioneer 3396','Davangere','Davangere APMC',2050,0.12),
  ('Soybean','JS-9560','Ujjain','Ujjain Mandi',4600,0.08),
  ('Cotton','Bt Cotton MRC-7017','Rajkot','Rajkot Mandi',7300,0.07),
  ('Onion','Nashik Red','Nashik','Lasalgaon Mandi',1800,0.18),
  ('Tomato','Arka Rakshak','Kolar','Kolar APMC',1450,0.22),
  ('Gram','JG-11','Bikaner','Bikaner Mandi',5600,0.09),
  ('Mustard','Pusa Bold','Bharatpur','Bharatpur Mandi',5350,0.10),
  ('Sugarcane','Co-0238','Meerut','Meerut Mandi',370,0.05)
) AS c(crop, variety, location, market, base, wave);