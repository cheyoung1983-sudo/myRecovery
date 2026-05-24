import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Heart, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  UserCircle, 
  BadgeCheck, 
  Sparkles, 
  Wind, 
  Calendar,
  Lock,
  User,
  Users,
  Compass,
  FileText,
  Bookmark
} from 'lucide-react';
import { UserProfile } from '../types';
import { SPOKANE_NEIGHBORHOODS, RECOVERY_NEEDS } from '../constants';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileOnboardingProps {
  user: { uid: string };
  profile: UserProfile;
  onComplete: () => void;
}

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ user, profile, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile fields state
  const [alias, setAlias] = useState(profile.alias || '');
  const [sobrietyDate, setSobrietyDate] = useState(profile.sobrietyDate || new Date().toISOString().split('T')[0]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(profile.neighborhood || '');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(profile.recoveryNeeds || []);
  
  // Demographics state
  const [gender, setGender] = useState<UserProfile['gender']>(profile.gender || 'male');
  const [sponsorPreference, setSponsorPreference] = useState<UserProfile['sponsorPreference']>(profile.sponsorPreference || 'same-gender');
  const [ageGroup, setAgeGroup] = useState<UserProfile['ageGroup']>(profile.ageGroup || '25_40');
  
  // Alignment & Program state
  const [primaryFellowship, setPrimaryFellowship] = useState<UserProfile['primaryFellowship']>(profile.primaryFellowship || 'AA');
  const [currentStep, setCurrentStep] = useState(profile.currentStep || 'Step 1');
  const [sponsorshipStyle, setSponsorshipStyle] = useState<UserProfile['sponsorshipStyle']>(profile.sponsorshipStyle || 'balanced');

  const toggleNeed = (need: string) => {
    setSelectedNeeds(prev => 
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const currentStepOptionLabel = (val: string) => {
    switch (val) {
      case '1_3': return 'Steps 1-3 (Foundation)';
      case '4_7': return 'Steps 4-7 (Reflection & Inventory)';
      case '8_9': return 'Steps 8-9 (Amends & Rebuilding)';
      case '10_12': return 'Steps 10-12 (Maintenance & Mentorship)';
      default: return val;
    }
  };

  const handleFinish = async () => {
    if (!selectedNeighborhood || selectedNeeds.length === 0 || !alias) return;
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        alias,
        sobrietyDate,
        neighborhood: selectedNeighborhood,
        recoveryNeeds: selectedNeeds,
        gender,
        sponsorPreference,
        ageGroup,
        primaryFellowship,
        currentStep,
        sponsorshipStyle,
        role: profile.role || 'user'
      });
      onComplete();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Step Validator
  const isStepValid = () => {
    if (step === 1) return alias.trim().length >= 2 && sobrietyDate;
    if (step === 2) return !!selectedNeighborhood;
    if (step === 3) return selectedNeeds.length > 0;
    if (step === 4) return !!gender && !!sponsorPreference && !!ageGroup;
    if (step === 5) return !!primaryFellowship && !!currentStep && !!sponsorshipStyle;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* PROGRESS BAR */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-900">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" 
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8 pt-10">
          {/* STEP HEADER */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
              Recovery Profile Onboarding
            </span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              Step {step} of 6
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <UserCircle className="text-blue-500" size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Let's Keep it Safe</h2>
                  <p className="text-slate-400 text-sm">Create a supportive, anonymous alias and select your recovery anniversary date.</p>
                </div>

                <div className="space-y-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">
                      Display Alias / Nickname
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text"
                        required
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="e.g. CleanSpokane99"
                        className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-650"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block leading-tight px-1 italic">
                      This nickname keeps your identity anonymous while posting in feeds & chat Rooms.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">
                      Sobriety Date / Anniversary
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="date"
                        required
                        value={sobrietyDate}
                        onChange={(e) => setSobrietyDate(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 p-4 pl-12 rounded-2xl text-sm text-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block leading-tight px-1 italic">
                      Used to calculate your milestones & award sobriety badges.
                    </span>
                  </div>
                </div>

                <button
                  disabled={!isStepValid()}
                  onClick={nextStep}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
                >
                  Continue to Neighborhood
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <MapPin className="text-blue-500" size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Your Spokane Hub</h2>
                  <p className="text-slate-400 text-sm">Where is your recovery home base? Connect with meetings and resources near you.</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-2 custom-scrollbar p-1">
                  {SPOKANE_NEIGHBORHOODS.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelectedNeighborhood(n)}
                      className={`py-4 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        selectedNeighborhood === n 
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/30 scale-[1.02]' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-900/50 p-4 rounded-2xl border border-dashed border-slate-800 flex items-center gap-3">
                  <Wind size={18} className="text-blue-400 shrink-0" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight">Setting your neighborhood matches you with local sponsors and lists close assemblies first.</p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    disabled={!isStepValid()}
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Heart className="text-emerald-500" size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Support & Specialties</h2>
                  <p className="text-slate-400 text-sm">What aspects of recovery do you need support with? Select all that apply to match sponsor fields.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar p-1">
                  {RECOVERY_NEEDS.map(need => (
                    <button
                      key={need}
                      type="button"
                      onClick={() => toggleNeed(need)}
                      className={`py-3.5 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-between transition-all cursor-pointer ${
                        selectedNeeds.includes(need)
                          ? 'bg-emerald-600/15 border-emerald-505/50 text-emerald-400 shadow-inner'
                          : 'bg-slate-900 border-slate-800/80 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {need}
                      {selectedNeeds.includes(need) ? (
                        <BadgeCheck size={16} className="text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-800" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    disabled={!isStepValid()}
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <Compass className="text-blue-500" size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Safety & Demographics</h2>
                  <p className="text-slate-400 text-sm">Traditional recovery prioritizes boundary parameters. Help us provide safe, aligned matching options.</p>
                </div>

                <div className="space-y-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800/80 text-left">
                  {/* Your Gender */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Your Gender</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['male', 'female', 'non-binary', 'other'] as const).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 px-1 text-[9px] font-black rounded-xl uppercase border text-center transition-all cursor-pointer ${
                            gender === g 
                              ? 'bg-blue-600 border-blue-400 text-white' 
                              : 'bg-slate-950 border-slate-850 text-slate-550 hover:bg-slate-900'
                          }`}
                        >
                          {g.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sponsor Preference */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Sponsor Target Preference</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['same-gender', 'male', 'female', 'no-preference'] as const).map(pref => (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => setSponsorPreference(pref as any)}
                          className={`py-2.5 px-1.5 text-[8.5px] font-black rounded-xl uppercase border text-center transition-all cursor-pointer ${
                            sponsorPreference === pref 
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-inner' 
                              : 'bg-slate-950 border-slate-850 text-slate-550 hover:bg-slate-900'
                          }`}
                        >
                          {pref.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                    <span className="text-[8px] text-slate-500 block leading-tight px-1 italic">
                      Highly recommended: Same-gender matching helps preserve recovery safety boundaries.
                    </span>
                  </div>

                  {/* Age Group */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Your Age Group</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['under_25', '25_40', '40_60', 'over_60'] as const).map(age => (
                        <button
                          key={age}
                          type="button"
                          onClick={() => setAgeGroup(age)}
                          className={`py-2 px-1 text-[9px] font-black rounded-xl uppercase border text-center transition-all cursor-pointer ${
                            ageGroup === age
                              ? 'bg-blue-600 border-blue-400 text-white' 
                              : 'bg-slate-950 border-slate-850 text-slate-550 hover:bg-slate-900'
                          }`}
                        >
                          {age.replace('_', '-')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    disabled={!isStepValid()}
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Compass className="text-emerald-500" size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Program & Relationship Style</h2>
                  <p className="text-slate-400 text-sm">Aligning your recovery fellowship curriculum and mentoring style requirements.</p>
                </div>

                <div className="space-y-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800/80 text-left">
                  {/* Primary Fellowship */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Primary Fellowship/Program</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['AA', 'NA', 'Celebrate Recovery', 'Al-Anon', 'Other'] as const).map(fellow => (
                        <button
                          key={fellow}
                          type="button"
                          onClick={() => setPrimaryFellowship(fellow)}
                          className={`py-2 px-1 text-[8.5px] font-black rounded-lg uppercase border text-center transition-all cursor-pointer ${
                            primaryFellowship === fellow 
                              ? 'bg-emerald-600 border-emerald-400 text-white' 
                              : 'bg-slate-950 border-slate-850 text-slate-550 hover:bg-slate-900'
                          }`}
                        >
                          {fellow === 'Celebrate Recovery' ? 'CR' : fellow}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Step */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Current 12-Step Scope</label>
                      <select
                        value={currentStep}
                        onChange={(e) => setCurrentStep(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-emerald-500"
                      >
                        <option value="Exploring">Exploring Steps (Start)</option>
                        <option value="Step 1-3">Steps 1-3 (Beginning)</option>
                        <option value="Step 4-7">Steps 4-7 (Inventory)</option>
                        <option value="Step 8-9">Steps 8-9 (Amends)</option>
                        <option value="Step 10-12">Steps 10-12 (Maintenance)</option>
                      </select>
                    </div>

                    {/* Sponsorship Style */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Sponsor Approach Match</label>
                      <select
                        value={sponsorshipStyle}
                        onChange={(e) => setSponsorshipStyle(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:border-emerald-500"
                      >
                        <option value="rigorous">Rigorous / Structured</option>
                        <option value="gentle">Gentle / Compassionate</option>
                        <option value="balanced">Balanced Alignment</option>
                        <option value="flexible">Flexible / Casual Check-Ins</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    disabled={!isStepValid()}
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 animate-pulse">
                    <Sparkles className="text-blue-500" size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase leading-none">Aesthetic Recovery Profile</h2>
                  <p className="text-slate-400 text-sm">Your deep-matching diagnostics are configured. Review before deployment.</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-64 overflow-y-auto custom-scrollbar text-sm text-left">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Alias Identity</span>
                    <span className="font-bold text-blue-400">{alias}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Spokane Neighborhood</span>
                    <span className="font-bold text-white">{selectedNeighborhood}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Sobriety Anniversary</span>
                    <span className="font-bold text-blue-400">{sobrietyDate}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">My Demographics</span>
                      <p className="text-xs text-white font-bold uppercase">{gender} • {ageGroup.replace('_', '-')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Target Sponsor Preference</span>
                      <p className="text-xs text-emerald-400 font-bold uppercase">{sponsorPreference.replace('-', ' ')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Program Fellowship</span>
                      <p className="text-xs text-white font-bold">{primaryFellowship} ({currentStep})</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Sponsor Approach</span>
                      <p className="text-xs text-blue-400 font-bold uppercase">{sponsorshipStyle}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Selected Focus Focus Subjects</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNeeds.map(n => (
                        <span key={n} className="px-2.5 py-1 bg-slate-800 border border-slate-700/50 rounded-lg text-[9px] font-black text-slate-300 uppercase tracking-wider">{n}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinish}
                    className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 cursor-pointer"
                  >
                    {isSubmitting ? 'Finalizing Profile...' : 'Activate Hub'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
