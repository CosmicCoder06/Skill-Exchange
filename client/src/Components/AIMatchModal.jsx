import { useState } from 'react';
import { hasMatchingSkill } from '../services/skillMatch.js';
import { BrainCircuit, Sparkles, ArrowRight, Zap, Target, IndianRupee, Calendar } from 'lucide-react';

const S = {
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#14221d',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #d7e2da',
    background: '#fff',
    color: '#14221d',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
};

export const AIMatchModal = ({ isOpen, onClose, onSelectMentor, loadMentors }) => {
  const [error, setError] = useState('');
  const [skillQuery, setSkillQuery] = useState('Data Structures & DAA');
  const [maxBudget, setMaxBudget] = useState(1000);
  const [preferredSchedule, setPreferredSchedule] = useState('Weekends');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleMatch = async (e) => {
    e.preventDefault();
    setIsSearching(true);

    setError('');
    setResults(null);
    try {
      const mentors = await loadMentors();
      const scored = mentors.filter(mentor => hasMatchingSkill(mentor.skillsTeach, skillQuery)).map((mentor) => {
        let score = 85;

        if (mentor.hourlyRate <= maxBudget) {
          score += 10;
        } else {
          score -= Math.min(20, Math.round((mentor.hourlyRate - maxBudget) / 100));
        }

        if (mentor.availability.toLowerCase().includes(preferredSchedule.toLowerCase()) || preferredSchedule === 'Any') {
          score += 10;
        }

        score += (mentor.rating - 4.5) * 10;

        const matchPercent = Math.min(99, Math.max(0, Math.round(score)));

        return {
          mentor,
          matchPercent,
          reason: `Teaches ${mentor.skillsTeach.slice(0, 2).join(', ') || 'skills not listed'}. ${mentor.hourlyRate <= maxBudget ? 'Within your budget' : 'Above your budget'}. Availability: ${mentor.availability || 'Not specified'}.`
        };
      });

      scored.sort((a, b) => b.matchPercent - a.matchPercent);
      setResults(scored.slice(0, 3));
    } catch (error) {
      setError(error.message || 'Unable to load mentors. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="ai-match-dialog" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(20,34,29,0.65)',
      backdropFilter: 'blur(4px)'
    }}>
      <div role="dialog" aria-modal="true" aria-label="AI Smart Mentor Matcher" style={{
        background: '#fff',
        width: '100%',
        maxWidth: '680px',
        borderRadius: '12px',
        boxShadow: '0 30px 80px rgba(20,34,29,0.25)',
        border: '1px solid rgba(20,34,29,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: '#1d3f32',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff'
            }}>
              <BrainCircuit size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>AI Smart Mentor Matcher</h2>
                <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#2e7b5e', color: '#fff', fontSize: '10px', fontWeight: 800 }}>
                  SMART
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#a9cdbb' }}>
                Matches your learning goals, preferred budget (₹), and availability.
              </p>
            </div>
          </div>
          <button
            aria-label="Close matcher"
            onClick={onClose}
            style={{
              border: 0,
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Query Form */}
          <form onSubmit={handleMatch} style={{
            padding: '18px',
            background: '#f8f9f5',
            border: '1px solid #d7e2da',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={13} color="#15745b" />
                Target Skill or Learning Topic
              </label>
              <input
                aria-label="Target skill or learning topic"
                type="text"
                value={skillQuery}
                disabled={isSearching}
                onChange={(e) => { setSkillQuery(e.target.value); setResults(null); setError(''); }}
                placeholder="e.g. React, DAA, System Design, Figma, Machine Learning"
                style={S.input}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IndianRupee size={12} color="#15745b" />
                  Max Hourly Rate: <strong style={{ color: '#15745b' }}>₹{maxBudget.toLocaleString('en-IN')}/hr</strong>
                </label>
                <input
                  aria-label="Maximum hourly rate"
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={maxBudget}
                  disabled={isSearching}
                  onChange={(e) => { setMaxBudget(Number(e.target.value)); setResults(null); }}
                  style={{ width: '100%', accentColor: '#15745b' }}
                />
              </div>

              <div>
                <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="#15745b" />
                  Preferred Timing
                </label>
                <select
                  aria-label="Preferred timing"
                  value={preferredSchedule}
                  disabled={isSearching}
                  onChange={(e) => { setPreferredSchedule(e.target.value); setResults(null); }}
                  style={{ ...S.input, cursor: 'pointer' }}
                >
                  <option value="Weekends">Weekends Only</option>
                  <option value="Weekdays">Weekdays</option>
                  <option value="Evenings">Evenings</option>
                  <option value="Any">Any Timing</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              style={{
                marginTop: '4px',
                padding: '11px',
                borderRadius: '999px',
                border: 0,
                background: '#176b4e',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 16px rgba(23,107,78,0.2)'
              }}
            >
              {isSearching ? (
                'Analyzing Compatibility...'
              ) : (
                <>
                  <Zap size={15} color="#fed7aa" />
                  Calculate Mentor Matches
                </>
              )}
            </button>
          </form>

          {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
          {results?.length === 0 && <p role="status">No matching mentors found for “{skillQuery.trim()}”. Try another skill.</p>}
          {/* Results Display */}
          {results?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <Sparkles size={16} color="#15745b" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#14221d', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Recommended Mentors ({results.length}):
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.map(({ mentor, matchPercent, reason }) => (
                  <div
                    className="ai-result-row" key={mentor.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #d7e2da',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#14221d' }}>{mentor.name}</h4>
                          <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#e8f4ef', color: '#15745b', fontSize: '10px', fontWeight: 800 }}>
                            {matchPercent}% Match
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#15745b', fontWeight: 600 }}>{mentor.title} · {mentor.company}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#718078' }}>{reason}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#14221d' }}>
                          ₹{mentor.hourlyRate?.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '11px', color: '#718078' }}>/hr</span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectMentor(mentor);
                          onClose();
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '999px',
                          border: 0,
                          background: '#176b4e',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        Book Now
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};




