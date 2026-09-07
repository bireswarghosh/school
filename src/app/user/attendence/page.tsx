import { redirect } from "next/navigation"

export default function AttendenceRedirect() {
  redirect("/user/attendance")
}