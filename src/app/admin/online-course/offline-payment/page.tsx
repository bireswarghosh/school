"use client"

import { useState, useMemo } from "react"
import { Search, DollarSign, X, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type Course = {
  id: number
  course: string
  section: string
  lesson: number
  quiz: number
  exam: number
  assignment: number
  provider: string
  price: number
  currentPrice: number
}

const studentOptions = ["Select", "Rahul Sharma", "Priya Gupta", "Amit Kumar", "Sneha Patel", "Arjun Nair"]
const paymentMethods = ["Cash", "Cheque", "Card", "Online Transfer"]

type PaymentRecord = {
  id?: number
  course: string
  amount: number
  method: string
  note: string
  date: string
}

const allCourses: Course[] = []

export default function OfflinePaymentPage() {
  const { symbol } = useCurrency()
  const { classNames, sectionNames } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]
  const { data: allCourses, add: recordPayment } = useApi<Course>("/api/online-course/offline-payment")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [filterStudent, setFilterStudent] = useState("")
  const [searched, setSearched] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payCourse, setPayCourse] = useState<Course | null>(null)
  const [amountToPay, setAmountToPay] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [note, setNote] = useState("")
  const [paidCourses, setPaidCourses] = useState<number[]>([])
  const [toastMessage, setToastMessage] = useState("")
  const [showToast, setShowToast] = useState(false)

  const filteredCourses = useMemo(() => {
    if (!searched) return []
    return (allCourses || []).filter((c) => {
      if (filterSection && c.section !== filterSection) return false
      return true
    })
  }, [searched, filterSection, allCourses])

  const handleSearch = () => {
    setSearched(true)
  }

  const handlePay = (course: Course) => {
    setPayCourse(course)
    setAmountToPay(String(course.currentPrice))
    setPaymentMethod("")
    setNote("")
    setShowPaymentModal(true)
  }

  const handlePayNow = async () => {
    if (!payCourse) return
    await recordPayment({
      course: payCourse.course,
      amount: parseFloat(amountToPay),
      method: paymentMethod,
      note,
      date: new Date().toLocaleDateString("en-US"),
    })
    setPaidCourses((prev) => [...prev, payCourse.id])
    setShowPaymentModal(false)
    setPayCourse(null)
    setToastMessage(`${payCourse.course} - Payment successful!`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const getStudentLabel = () => {
    return filterStudent || "Select"
  }

  return (
    <div className="space-y-6">
      {showToast && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in">
          <Check className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><DollarSign className="h-4 w-4 text-white" /></span>
            Offline Payment
          </h2>
          <p className="text-sm text-white/80 mt-1">Online Course / Record cash, cheque or transfer payments</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch() }}
          className="p-5"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {classOptions.map((opt) => (
                  <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {sectionOptions.map((opt) => (
                  <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {studentOptions.map((opt) => (
                  <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              Courses {filterStudent && <span className="text-gray-500 font-normal">- {filterStudent}</span>}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Course</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Section</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Lesson</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Quiz</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Exam</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Assignment</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Provider</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Current Price</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400">No courses found</td>
                  </tr>
                ) : (
                  filteredCourses.map((course, idx) => (
                    <tr key={course.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{course.course}</td>
                      <td className="px-4 py-3 text-gray-600">{course.section}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{course.lesson}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{course.quiz}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{course.exam}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{course.assignment}</td>
                      <td className="px-4 py-3 text-gray-600">{course.provider}</td>
                      <td className="px-4 py-3 text-right text-gray-500 line-through">{symbol}{course.price}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{symbol}{course.currentPrice}</td>
                      <td className="px-4 py-3 text-center">
                        {paidCourses.includes(course.id) ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <Check className="h-3.5 w-3.5" />
                            Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePay(course)}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 mx-auto"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPaymentModal && payCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Online Course Fees</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Course</span>
                  <span className="font-medium text-gray-800">{payCourse.course}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price</span>
                  <span className="text-gray-500 line-through">{symbol}{payCourse.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Price</span>
                  <span className="font-semibold text-green-700">{symbol}{payCourse.currentPrice}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
                <input
                  type="text"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Select</option>
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayNow}
                className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
