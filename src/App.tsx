import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight, Command, Loader2, AlertCircle } from 'lucide-react';

type AppState = 'idle' | 'processing' | 'split' | 'submitted';

interface SessionData {
  id: string;
  targetState: string;
  canonicalPayload: any;
  readinessScore: number;
  missingFields: { path: string; helpText: string }[];
}

const FormField = ({ label, value, isMissing }: { label: string, value: any, isMissing: boolean }) => {
  return (
    <motion.div
      initial={{ backgroundColor: 'rgba(255,255,255,0)' }}
      animate={{ backgroundColor: value && !isMissing ? ['rgba(52,211,153,0.15)', 'rgba(255,255,255,0)'] : 'rgba(255,255,255,0)' }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className={`py-4 border-b border-white/10 flex justify-between items-baseline group ${isMissing ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className="text-slate-400 font-light text-lg">{label}</span>
      <div className="flex items-center gap-3 max-w-[60%]">
        <span className="text-slate-50 font-medium text-lg text-right truncate">
          {value || 'Missing'}
        </span>
        {value && !isMissing && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isMissing && <AlertCircle className="w-5 h-5 text-fuchsia-400 shrink-0" />}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [targetState, setTargetState] = useState('');
  const [session, setSession] = useState<SessionData | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleAnalyze = async () => {
    if (!targetState) return;
    setAppState('processing');

    try {
      const res = await fetch(`/api/companies/demo-company/compliance-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState })
      });
      const data = await res.json();
      
      setTimeout(() => {
        setSession(data);
        setAppState('split');
      }, 2400);
    } catch (err) {
      console.error(err);
      setAppState('idle');
    }
  };

  const handleSubmitField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !inputValue.trim()) return;

    const currentField = session.missingFields[0];
    
    try {
      const res = await fetch(`/api/compliance-sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldPath: currentField.path, value: inputValue })
      });
      const updatedSession = await res.json();
      
      setInputValue('');
      setSession(updatedSession);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRegistration = () => {
    setAppState('submitted');
  };

  const pageVariants = {
    initial: { opacity: 0, y: 40, filter: 'blur(20px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -40, filter: 'blur(20px)', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  const isFieldMissing = (path: string) => session?.missingFields.some(f => f.path === path) || false;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-50 font-sans selection:bg-fuchsia-500/30 overflow-x-hidden flex flex-col relative">
      
      {/* Atmospheric Background (Hydra/Gridania/Kuja) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[30vw] h-[30vw] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-fuchsia-500/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      {/* Minimal Header */}
      <header className="px-12 py-10 flex items-center justify-between absolute top-0 w-full z-10">
        <div className="flex items-center gap-3">
          <Command className="w-8 h-8 text-white" />
          <span className="font-semibold tracking-tighter text-2xl">StateSync</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center relative z-10 px-8 pt-32 pb-24">
        <AnimatePresence mode="wait">
          
          {/* IDLE STATE */}
          {appState === 'idle' && (
            <motion.div 
              key="idle"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-5xl mx-auto w-full text-center"
            >
              <h1 className="text-7xl md:text-9xl font-medium tracking-tighter mb-8 pb-4">
                <span className="bg-gradient-to-br from-emerald-300 via-cyan-300 to-fuchsia-400 text-transparent bg-clip-text">
                  Boundless
                </span>
                <motion.span
                  animate={{ 
                    opacity: [0.2, 1, 0.2],
                    textShadow: ["0px 0px 0px rgba(232,121,249,0)", "0px 0px 30px rgba(232,121,249,1)", "0px 0px 0px rgba(232,121,249,0)"]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-fuchsia-400 inline-block"
                >
                  .
                </motion.span>
              </h1>
              <p className="text-2xl md:text-3xl text-slate-400 mb-20 font-light max-w-3xl mx-auto leading-relaxed">
                Hire anywhere. We orchestrate the compliance automatically.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-6 mb-20">
                {['NY', 'CA', 'WA'].map(state => (
                  <button 
                    key={state}
                    onClick={() => setTargetState(state)} 
                    className={`px-12 py-6 rounded-full text-2xl font-light transition-all duration-500 backdrop-blur-md border ${targetState === state ? 'bg-white/10 border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-105' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
                  >
                    {state === 'NY' ? 'New York' : state === 'CA' ? 'California' : 'Washington'}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {targetState && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    onClick={handleAnalyze}
                    className="px-12 py-6 bg-white text-black rounded-full text-xl font-medium transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3 mx-auto"
                  >
                    Begin Registration <ArrowRight className="w-6 h-6" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {appState === 'processing' && (
            <motion.div 
              key="processing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center text-center"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="mb-12"
              >
                <Loader2 className="w-16 h-16 text-cyan-400" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
                Analyzing requirements.
              </h2>
              <p className="text-2xl text-slate-400 font-light">
                Cross-referencing your profile with {targetState} tax law.
              </p>
            </motion.div>
          )}

          {/* SPLIT STATE (Assistant + Form) */}
          {appState === 'split' && session && (
            <motion.div 
              key="split"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-start"
            >
              {/* LEFT PANE: Assistant & Score */}
              <div className="lg:col-span-5 sticky top-32">
                
                {/* Readiness Score */}
                <div className="mb-12">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-cyan-400 text-sm font-semibold tracking-widest uppercase">Compliance Readiness</h3>
                    <div className="text-5xl font-medium tracking-tighter text-white">
                      {session.readinessScore}<span className="text-slate-500 text-3xl">%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${session.readinessScore}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Conversational UI */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-md p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-50" />
                  
                  {session.missingFields.length > 0 ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={session.missingFields[0].path}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <p className="text-lg text-slate-300 font-light mb-8 leading-relaxed">
                          I've autonomously pre-filled your {targetState} application using your company profile. I just need a few specific details to complete the registration.
                        </p>
                        <form onSubmit={handleSubmitField}>
                          <label className="block text-2xl font-medium text-white mb-6 leading-tight">
                            {session.missingFields[0].helpText}
                          </label>
                          <div className="flex gap-4">
                            <input 
                              autoFocus
                              type="text"
                              value={inputValue}
                              onChange={e => setInputValue(e.target.value)}
                              className="flex-1 bg-black/20 border border-white/10 text-white text-lg rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 block p-4 outline-none transition-all placeholder:text-white/20 font-light"
                              placeholder="Type your answer..."
                            />
                            <button
                              type="submit"
                              disabled={!inputValue.trim()}
                              className="bg-white text-black rounded-2xl px-6 disabled:opacity-50 hover:scale-105 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                              <ArrowRight className="w-6 h-6" />
                            </button>
                          </div>
                        </form>
                        <div className="mt-6 text-sm text-slate-500 font-light">
                          {session.missingFields.length} question{session.missingFields.length !== 1 ? 's' : ''} remaining
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-4"
                    >
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-medium text-white mb-4">Ready to file.</h3>
                      <p className="text-slate-400 font-light mb-10">
                        All required fields for {targetState} have been verified and formatted.
                      </p>
                      <button 
                        onClick={handleSubmitRegistration} 
                        className="w-full py-5 bg-white text-black rounded-2xl text-lg font-medium hover:scale-105 transition-all duration-500 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      >
                        Submit Registration <CheckCircle2 className="w-6 h-6" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* RIGHT PANE: Auto-filling Form */}
              <div className="lg:col-span-7 bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
                  <h2 className="text-2xl font-medium tracking-tight text-white">State Registration Form</h2>
                  <span className="px-4 py-1.5 bg-white/10 text-slate-300 text-xs font-semibold rounded-full uppercase tracking-widest border border-white/5">
                    {targetState} Official
                  </span>
                </div>

                <div className="space-y-12">
                  <div>
                    <h3 className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">Employer Details</h3>
                    <FormField label="Legal Name" value={session.canonicalPayload.employer?.legal_name} isMissing={isFieldMissing("employer.legal_name")} />
                    <FormField label="FEIN" value={session.canonicalPayload.employer?.fein} isMissing={isFieldMissing("employer.fein")} />
                    <FormField label="Entity Type" value={session.canonicalPayload.employer?.entity_type} isMissing={isFieldMissing("employer.entity_type")} />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold tracking-widest uppercase text-cyan-400 mb-4">Business Address</h3>
                    <FormField label="Street" value={session.canonicalPayload.business_address?.street_1} isMissing={isFieldMissing("business_address.street_1")} />
                    <FormField label="City" value={session.canonicalPayload.business_address?.city} isMissing={isFieldMissing("business_address.city")} />
                    <FormField label="State" value={session.canonicalPayload.business_address?.state} isMissing={isFieldMissing("business_address.state")} />
                    <FormField label="ZIP" value={session.canonicalPayload.business_address?.zip} isMissing={isFieldMissing("business_address.zip")} />
                  </div>

                  {(session.targetState === 'NY' || session.targetState === 'WA') && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest uppercase text-fuchsia-400 mb-4">Operations</h3>
                      <FormField label="First Operations Date" value={session.canonicalPayload.operations?.first_operations_date} isMissing={isFieldMissing("operations.first_operations_date")} />
                      {session.targetState === 'NY' && <FormField label="First Withholding Date" value={session.canonicalPayload.operations?.first_withholding_date} isMissing={isFieldMissing("operations.first_withholding_date")} />}
                      {session.targetState === 'NY' && <FormField label="First Wages Quarter" value={session.canonicalPayload.operations?.first_wages_quarter} isMissing={isFieldMissing("operations.first_wages_quarter")} />}
                      {session.targetState === 'NY' && <FormField label="First Wages Year" value={session.canonicalPayload.operations?.first_wages_year} isMissing={isFieldMissing("operations.first_wages_year")} />}
                    </div>
                  )}

                  {session.targetState === 'WA' && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">Employment</h3>
                      <FormField label="WA Income Bracket" value={session.canonicalPayload.employment?.wa_income_bracket} isMissing={isFieldMissing("employment.wa_income_bracket")} />
                    </div>
                  )}

                  {session.targetState === 'CA' && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest uppercase text-cyan-400 mb-4">Ownership</h3>
                      <FormField label="Primary Owner Name" value={session.canonicalPayload.ownership?.[0]?.name} isMissing={isFieldMissing("ownership.0.name")} />
                      <FormField label="SSN (Last 4)" value={session.canonicalPayload.ownership?.[0]?.ssn_last4} isMissing={isFieldMissing("ownership.0.ssn_last4")} />
                      <FormField label="Driver's License" value={session.canonicalPayload.ownership?.[0]?.drivers_license_last4} isMissing={isFieldMissing("ownership.0.drivers_license_last4")} />
                      <FormField label="Percent Owned" value={session.canonicalPayload.ownership?.[0]?.percent_owned} isMissing={isFieldMissing("ownership.0.percent_owned")} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* SUBMITTED STATE */}
          {appState === 'submitted' && (
            <motion.div 
              key="submitted"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto"
            >
              <motion.div 
                initial={{ scale: 0, rotate: -180 }} 
                animate={{ scale: 1, rotate: 0 }} 
                transition={{ type: "spring", bounce: 0.5, duration: 1.2 }}
                className="w-40 h-40 bg-gradient-to-br from-emerald-400 via-cyan-400 to-fuchsia-500 rounded-full flex items-center justify-center mb-16 shadow-[0_0_60px_rgba(45,212,191,0.3)]"
              >
                <CheckCircle2 className="w-20 h-20 text-black" />
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-white mb-8">
                Registration complete.
              </h1>
              <p className="text-2xl md:text-3xl text-slate-400 font-light mb-20 leading-relaxed">
                Your {targetState} state tax registration has been successfully filed. We will notify you once the state approves your account.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-white font-medium text-xl flex items-center gap-3 hover:opacity-60 transition-opacity"
              >
                Register another state <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
