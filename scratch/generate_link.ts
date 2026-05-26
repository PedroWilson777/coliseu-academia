
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: "pedrowicloud@gmail.com"
  })
  
  if (error) console.error("Error:", error)
  else console.log("Generated Link:", data.properties.action_link)
}

main()

