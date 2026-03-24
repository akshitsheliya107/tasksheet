// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://immaoydvppopphbjcdvj.supabase.co"; // Replace with your URL
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbWFveWR2cHBvcHBoYmpjZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjY1MjgsImV4cCI6MjA4NDA0MjUyOH0.hP2-bCOtaktUGhuT8ef9WdNAyEamCKxXiU8KhCca_Tk"; // Replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
