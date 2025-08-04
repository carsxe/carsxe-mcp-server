export interface CarsXESpecsResponse {
  success: boolean;
  input: {
    key: string;
    vin: string;
  };
  attributes: {
    year: string;
    make: string;
    model: string;
    trim: string;
    style: string;
    made_in: string;
    engine: string;
    transmission: string;
    drivetrain: string;
    city_mileage: string;
    highway_mileage: string;
    fuel_capacity: string;
    overall_length: string;
    overall_width: string;
    overall_height: string;
    wheelbase_length: string;
    curb_weight: string;
    turning_diameter: string;
    standard_seating: string;
    front_headroom?: string;
    rear_headroom?: string;
    front_shoulder_room?: string;
    rear_shoulder_room?: string;
    manufacturer_suggested_retail_price: string;
    invoice_price: string;
    delivery_charges: string;
    interior_trim?: string[];
    exterior_color?: string[];
    [key: string]: any;
  };
  colors: Array<{
    category: string;
    name: string;
  }>;
  equipment: Record<string, string>;
  warranties: Array<{
    type: string;
    miles?: string;
    months?: string;
  }>;
}

export interface CarsXEPlateDecoderResponse {
  success: boolean;
  input: {
    plate: string;
    state: string;
    country: string;
  };
  description: string;
  make: string;
  model: string;
  trim: string;
  vin: string;
  style: string;
  year: string;
  assembly: string;
  fuel_type: string;
  color: string;
  body_style: string;
  engine_size: string;
  drive_type: string;
  transmission: string;
}

export interface CarsXEInternationalVinDecoderResponse {
  success: boolean;
  input: {
    vin: string;
  };
  attributes: {
    vin: string;
    vid: string;
    make: string;
    model: string;
    year: string;
    product_type: string;
    body: string;
    series: string;
    fuel_type: string;
    gears: string;
    emission_standard: string;
    manufacturer: string;
    manufacturer_address: string;
    plant_country: string;
    engine_manufacturer: string;
    avg_co2_emission_g_km: string;
    no_of_axels: string;
    no_of_doors: string;
    no_of_seats: string;
    rear_brakes: string;
    steering_type: string;
    rear_suspension: string;
    front_suspension: string;
    wheel_size: string;
    wheel_size_array: string;
    wheelbase_mm: string;
    wheelbase_array_mm: string;
    height_mm: string;
    length_mm: string;
    width_mm: string;
    track_front_mm: string;
    track_rear_mm: string;
    max_speed_kmh: string;
    max_trunk_capacity_liters: string;
    min_trunk_capacity_liters: string;
    weight_empty_kg: string;
    max_weight_kg: string;
    max_roof_load_kg: string;
    permitted_trailer_load_without_brakes_kg: string;
    abs: string;
    check_digit: string;
    sequential_number: string;
  };
  timestamp: string;
}

export interface CarsXEMarketValueResponse {
  uid?: string;
  input: {
    vin: string;
    state?: string;
    country?: string;
  };
  publish_date?: string;
  data_freq?: string;
  state?: string;
  country?: string;
  uvc?: string;
  group_num?: string;
  model_year?: string;
  make?: string;
  model?: string;
  series?: string;
  style?: string;
  mileage_cat?: string;
  class_code?: string;
  class_name?: string;
  description_score?: string;
  first_values_flag?: boolean;
  risk_score?: string;
  whole_xclean?: any;
  whole_clean?: any;
  whole_avg?: any;
  whole_rough?: any;
  retail_xclean?: any;
  retail_clean?: any;
  retail_avg?: any;
  retail_rough?: any;
  trade_in_clean?: any;
  trade_in_avg?: any;
  trade_in_rough?: any;
  msrp?: string;
  retail_equipped?: any;
}

export interface CarsXEHistoryResponse {
  vin: string;
  success: boolean;
  junkAndSalvageInformation?: any[];
  insuranceInformation?: any[];
  brandsRecordCount?: number;
  brandsInformation?: any[];
  vinChanged?: boolean;
  currentTitleInformation?: any[];
  historyInformation?: any[];
  status?: string;
  error?: { code?: string; message?: string };
}

export interface CarsXEImagesResponse {
  success: boolean;
  error?: string;
  images?: Array<{
    mime: string;
    link: string;
    contextLink?: string;
    height?: number;
    width?: number;
    byteSize?: number;
    thumbnailLink?: string;
    thumbnailHeight?: number;
    thumbnailWidth?: number;
    hostPageDomainFriendlyName?: string;
    accentColor?: string;
    datePublished?: string;
  }>;
  query?: Record<string, any>;
}

export interface CarsXERecallsResponse {
  success: boolean;
  input?: {
    key?: string;
    vin: string;
  };
  data?: {
    uuid?: string;
    vin?: string;
    manufacturer?: string;
    model_year?: string;
    make?: string;
    model?: string;
    has_recalls?: boolean;
    recall_count?: number;
    recalls?: Array<{
      recall_date?: string;
      expiration_date?: string | null;
      nhtsa_id?: string;
      manufacturer_id?: string;
      recall_campaign_type?: string;
      recall_name?: string;
      component?: string;
      recall_description?: string;
      risk_description?: string;
      stop_sale?: boolean | null;
      dont_drive?: boolean | null;
      remedy_available?: boolean | null;
      recall_remedy?: string;
      parts_available?: boolean | null;
      labor_hours_min?: string | null;
      labor_hours_max?: string | null;
      recall_status?: string;
    }>;
  };
  timestamp?: string;
}

export interface CarsXEVinOcrResponse {
  success: boolean;
  vin?: string;
  box?: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
  };
  confidence?: number;
  candidates?: Array<{
    vin: string;
    confidence: number;
    box: {
      xmin: number;
      xmax: number;
      ymin: number;
      ymax: number;
    };
  }>;
  message?: string;
}

export interface CarsXEYearMakeModelResponse {
  bestMatch?: {
    make: string;
    model: string;
    year: number | string;
    name: string;
    base_msrp: number;
    base_invoice: number;
    total_seating: number;
    color: {
      exterior: Array<{ name: string; rgb: string }>;
      interior: Array<{ name: string; rgb: string }>;
    };
    features: {
      standard: Array<{
        category: string;
        features: Array<{ name: string; value: string | null }>;
      }>;
      optional: Array<{
        category: string;
        features: Array<{ name: string; price?: number | null }>;
      }>;
    };
    is_truck: boolean;
    is_electric: boolean;
    is_plugin_electric: boolean;
  };
  trimOptions?: Array<any>;
  success: boolean;
  input: {
    year: string;
    make: string;
    model: string;
    trim?: string;
  };
  timestamp?: string;
  message?: string;
}

export interface CarsXEObdCodeResponse {
  success: boolean;
  diagnosis?: string;
  date?: string;
  code?: string;
}

export interface CarsXEPlateRecognitionResponse {
  success: boolean;
  message?: string;
  camera_id?: string | null;
  filename?: string;
  processing_time?: number;
  results?: Array<{
    box: {
      xmax: number;
      xmin: number;
      ymax: number;
      ymin: number;
    };
    candidates: Array<{
      plate: string;
      score: number;
    }>;
    dscore?: number;
    plate: string;
    region?: {
      code: string;
      score: number;
    };
    score: number;
    vehicle?: {
      score: number;
      type: string;
    };
  }>;
}
