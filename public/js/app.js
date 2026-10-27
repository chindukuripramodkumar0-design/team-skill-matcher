const { useState, useEffect, useMemo, useCallback, useRef } = React;

    // ========== ICONS ==========
    const Icon = ({ name, size = 18, className = '' }) => {
      const ref = useRef(null);
      useEffect(() => {
        if (ref.current && window.lucide) {
          ref.current.innerHTML = '';
          const pascal = String(name).split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
          const iconNode = window.lucide.icons[pascal] || window.lucide.icons[name];
          if (!iconNode) return;
          const icon = window.lucide.createElement(iconNode);
          if (icon) {
            icon.setAttribute('width', size);
            icon.setAttribute('height', size);
            icon.setAttribute('stroke-width', '1.75');
            ref.current.appendChild(icon);
          }
        }
      }, [name, size]);
      return <span ref={ref} className={`inline-flex items-center justify-center ${className}`} />;
    };

    // ========== CONSTANTS ==========
    const DB_KEY = 'grok_team_matcher_db';
    const PROFICIENCY = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const PROF_SCORE = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
    const EXPERIENCE = ['Junior', 'Mid', 'Senior', 'Lead'];
    const PRIORITY = ['Must-Have', 'Nice-to-Have'];

    // ========== DEMO DATA ==========
    const DEMO_TEAM = [
      {
        id: 'm1', name: 'Aisha Khan', role: 'Senior ML Engineer', experience: 'Senior',
        skills: [
          { name: 'Python', level: 'Expert' }, { name: 'PyTorch', level: 'Advanced' },
          { name: 'NLP', level: 'Advanced' }, { name: 'MLOps', level: 'Intermediate' },
          { name: 'System Design', level: 'Advanced' }
        ]
      },
      {
        id: 'm2', name: 'Marcus Chen', role: 'Full-Stack Engineer', experience: 'Mid',
        skills: [
          { name: 'React', level: 'Expert' }, { name: 'TypeScript', level: 'Advanced' },
          { name: 'Node.js', level: 'Advanced' }, { name: 'PostgreSQL', level: 'Intermediate' },
          { name: 'AWS', level: 'Intermediate' }
        ]
      },
      {
        id: 'm3', name: 'Sofia Ramirez', role: 'Data Scientist', experience: 'Senior',
        skills: [
          { name: 'Python', level: 'Expert' }, { name: 'Statistics', level: 'Expert' },
          { name: 'SQL', level: 'Advanced' }, { name: 'Tableau', level: 'Advanced' },
          { name: 'A/B Testing', level: 'Advanced' }
        ]
      },
      {
        id: 'm4', name: 'Jamal Wright', role: 'DevOps Engineer', experience: 'Lead',
        skills: [
          { name: 'Kubernetes', level: 'Expert' }, { name: 'Terraform', level: 'Advanced' },
          { name: 'AWS', level: 'Expert' }, { name: 'CI/CD', level: 'Expert' },
          { name: 'Python', level: 'Intermediate' }
        ]
      },
      {
        id: 'm5', name: 'Elena Petrov', role: 'Product Designer', experience: 'Mid',
        skills: [
          { name: 'Figma', level: 'Expert' }, { name: 'User Research', level: 'Advanced' },
          { name: 'Prototyping', level: 'Advanced' }, { name: 'Design Systems', level: 'Intermediate' },
          { name: 'HTML/CSS', level: 'Intermediate' }
        ]
      },
      {
        id: 'm6', name: 'Kenji Tanaka', role: 'Backend Engineer', experience: 'Junior',
        skills: [
          { name: 'Go', level: 'Intermediate' }, { name: 'PostgreSQL', level: 'Intermediate' },
          { name: 'Redis', level: 'Beginner' }, { name: 'Docker', level: 'Intermediate' },
          { name: 'Python', level: 'Beginner' }
        ]
      }
    ];

    const DEMO_PROJECTS = [
      {
        id: 'p1', name: 'LLM Inference Platform', department: 'AI Platform',
        targetRoles: ['Senior ML Engineer', 'MLOps Engineer'],
        skills: [
          { name: 'Python', priority: 'Must-Have', minLevel: 'Advanced' },
          { name: 'PyTorch', priority: 'Must-Have', minLevel: 'Advanced' },
          { name: 'MLOps', priority: 'Must-Have', minLevel: 'Intermediate' },
          { name: 'Kubernetes', priority: 'Nice-to-Have', minLevel: 'Intermediate' },
          { name: 'System Design', priority: 'Must-Have', minLevel: 'Advanced' }
        ]
      },
      {
        id: 'p2', name: 'Customer Analytics Dashboard', department: 'Data & Insights',
        targetRoles: ['Data Scientist', 'Full-Stack Engineer'],
        skills: [
          { name: 'Python', priority: 'Must-Have', minLevel: 'Advanced' },
          { name: 'SQL', priority: 'Must-Have', minLevel: 'Advanced' },
          { name: 'React', priority: 'Nice-to-Have', minLevel: 'Intermediate' },
          { name: 'Tableau', priority: 'Must-Have', minLevel: 'Intermediate' },
          { name: 'Statistics', priority: 'Must-Have', minLevel: 'Advanced' }
        ]
      }
    ];

    // ========== STORAGE HELPERS ==========
    function loadDB() {
      try {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch { return null; }
    }

    function saveDB(db) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }

    function seedDB() {
      const demoUser = {
        id: 'u_demo',
        email: 'demo@acme.ai',
        password: 'demo123',
        orgName: 'Acme AI',
        team: DEMO_TEAM,
        projects: DEMO_PROJECTS
      };
      const db = {
        users: [demoUser],
        currentUserId: null
      };
      saveDB(db);
      return db;
    }

    function getOrInitDB() {
      let db = loadDB();
      if (!db || !db.users || db.users.length === 0) {
        db = seedDB();
      }
      return db;
    }

    // ========== MATCHING ALGORITHM ==========
    function calculateMatch(member, project) {
      if (!project || !project.skills || project.skills.length === 0) {
        return { score: 0, matched: [], missing: [], details: [] };
      }

      let totalWeight = 0;
      let earned = 0;
      const matched = [];
      const missing = [];
      const details = [];

      const memberSkillMap = {};
      (member.skills || []).forEach(s => {
        memberSkillMap[s.name.toLowerCase()] = s.level;
      });

      project.skills.forEach(req => {
        const weight = req.priority === 'Must-Have' ? 3 : 1;
        totalWeight += weight;
        const key = req.name.toLowerCase();
        const memberLevel = memberSkillMap[key];
        const reqScore = PROF_SCORE[req.minLevel] || 2;
        const memScore = memberLevel ? (PROF_SCORE[memberLevel] || 0) : 0;

        if (memScore >= reqScore) {
          const ratio = Math.min(1, memScore / 4);
          earned += weight * (0.7 + 0.3 * ratio); // base credit + proficiency bonus
          matched.push({ name: req.name, level: memberLevel, required: req.minLevel, priority: req.priority });
          details.push({ skill: req.name, status: 'matched', memberLevel, required: req.minLevel, priority: req.priority });
        } else {
          missing.push({ name: req.name, required: req.minLevel, priority: req.priority, has: memberLevel || 'None' });
          details.push({ skill: req.name, status: 'missing', memberLevel: memberLevel || 'None', required: req.minLevel, priority: req.priority });
        }
      });

      // Role affinity bonus (small)
      let roleBonus = 0;
      if (project.targetRoles && project.targetRoles.length) {
        const roleMatch = project.targetRoles.some(r =>
          member.role.toLowerCase().includes(r.toLowerCase()) ||
          r.toLowerCase().includes(member.role.toLowerCase().split(' ')[0])
        );
        if (roleMatch) roleBonus = 5;
      }

      const baseScore = totalWeight > 0 ? (earned / totalWeight) * 100 : 0;
      const score = Math.min(100, Math.round(baseScore + roleBonus));

      return { score, matched, missing, details };
    }

    // ========== COMPONENTS ==========

    // Badge
    function MatchBadge({ score }) {
      let cls = 'badge-low';
      let label = 'Low';
      if (score >= 85) { cls = 'badge-high'; label = 'High'; }
      else if (score >= 60) { cls = 'badge-med'; label = 'Medium'; }
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
          {score}% · {label}
        </span>
      );
    }

    // Modal
    function Modal({ open, onClose, title, children, wide = false }) {
      if (!open) return null;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <div className={`relative glass rounded-xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </div>
        </div>
      );
    }

    // Auth Page
    function AuthPage({ onLogin }) {
      const [mode, setMode] = useState('login');
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [orgName, setOrgName] = useState('');
      const [error, setError] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        let db = getOrInitDB();

        if (mode === 'login') {
          const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
          if (!user) {
            setError('Invalid email or password. Try demo@acme.ai / demo123');
            return;
          }
          db.currentUserId = user.id;
          saveDB(db);
          onLogin(user);
        } else {
          if (!email || !password || !orgName) {
            setError('All fields are required');
            return;
          }
          if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setError('Email already registered');
            return;
          }
          const newUser = {
            id: 'u_' + Date.now(),
            email,
            password,
            orgName,
            team: [],
            projects: []
          };
          db.users.push(newUser);
          db.currentUserId = newUser.id;
          saveDB(db);
          onLogin(newUser);
        }
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
          <div className="relative w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-glow mb-4">
                <Icon name="users" size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Team Skill Matcher</h1>
              <p className="text-gray-400 mt-1 text-sm">AI-assisted skill matching for modern teams</p>
            </div>

            <div className="glass rounded-2xl p-8 shadow-glow-sm">
              <div className="flex gap-1 mb-6 p-1 bg-black/50 rounded-lg">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'login' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Log in
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'signup' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Organization / Team Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="Acme AI"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-100 transition shadow-lg"
                >
                  {mode === 'login' ? 'Continue' : 'Create Account'}
                </button>
              </form>

              {mode === 'login' && (
                <p className="mt-5 text-center text-xs text-gray-500">
                  Demo: <span className="text-gray-300">demo@acme.ai</span> / <span className="text-gray-300">demo123</span>
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Skill Tag Input
    function SkillEditor({ skills, onChange }) {
      const [name, setName] = useState('');
      const [level, setLevel] = useState('Intermediate');

      const add = () => {
        if (!name.trim()) return;
        if (skills.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) return;
        onChange([...skills, { name: name.trim(), level }]);
        setName('');
        setLevel('Intermediate');
      };

      const remove = (idx) => {
        onChange(skills.filter((_, i) => i !== idx));
      };

      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                <span className="font-medium">{s.name}</span>
                <span className="text-gray-400">· {s.level}</span>
                <button onClick={() => remove(i)} className="ml-0.5 text-gray-500 hover:text-rose-400">
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
              placeholder="Skill name"
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
            />
            <select value={level} onChange={e => setLevel(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
              {PROFICIENCY.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" onClick={add} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium">
              Add
            </button>
          </div>
        </div>
      );
    }

    // Project Skill Editor
    function ProjectSkillEditor({ skills, onChange }) {
      const [name, setName] = useState('');
      const [priority, setPriority] = useState('Must-Have');
      const [minLevel, setMinLevel] = useState('Intermediate');

      const add = () => {
        if (!name.trim()) return;
        if (skills.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) return;
        onChange([...skills, { name: name.trim(), priority, minLevel }]);
        setName('');
        setPriority('Must-Have');
        setMinLevel('Intermediate');
      };

      const remove = (idx) => {
        onChange(skills.filter((_, i) => i !== idx));
      };

      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {skills.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{s.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${s.priority === 'Must-Have' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {s.priority}
                  </span>
                  <span className="text-gray-400 text-xs">Min: {s.minLevel}</span>
                </div>
                <button onClick={() => remove(i)} className="text-gray-500 hover:text-rose-400">
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
              placeholder="Skill name"
              className="sm:col-span-1 px-3 py-2 rounded-lg border text-sm"
            />
            <select value={priority} onChange={e => setPriority(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
              {PRIORITY.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={minLevel} onChange={e => setMinLevel(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
              {PROFICIENCY.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" onClick={add} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium">
              Add Skill
            </button>
          </div>
        </div>
      );
    }

    // Team Roster Tab
    function TeamRoster({ team, onUpdate }) {
      const [modal, setModal] = useState(null); // null | 'add' | member
      const [form, setForm] = useState({ name: '', role: '', experience: 'Mid', skills: [] });

      const openAdd = () => {
        setForm({ name: '', role: '', experience: 'Mid', skills: [] });
        setModal('add');
      };

      const openEdit = (m) => {
        setForm({ ...m, skills: [...(m.skills || [])] });
        setModal(m);
      };

      const save = () => {
        if (!form.name.trim() || !form.role.trim()) return;
        let next;
        if (modal === 'add') {
          const newM = { ...form, id: 'm_' + Date.now(), name: form.name.trim(), role: form.role.trim() };
          next = [...team, newM];
        } else {
          next = team.map(m => m.id === modal.id ? { ...form, id: modal.id, name: form.name.trim(), role: form.role.trim() } : m);
        }
        onUpdate(next);
        setModal(null);
      };

      const remove = (id) => {
        if (!confirm('Remove this team member?')) return;
        onUpdate(team.filter(m => m.id !== id));
      };

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Team Roster</h2>
              <p className="text-sm text-gray-400">{team.length} members</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition">
              <Icon name="plus" size={16} /> Add Member
            </button>
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Experience</th>
                    <th className="px-4 py-3 font-medium">Skills</th>
                    <th className="px-4 py-3 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {team.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        No team members yet. Add your first co-worker.
                      </td>
                    </tr>
                  )}
                  {team.map(m => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-gray-300">{m.role}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-300">{m.experience}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {(m.skills || []).slice(0, 4).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-xs text-gray-400">
                              {s.name}
                            </span>
                          ))}
                          {(m.skills || []).length > 4 && (
                            <span className="text-xs text-gray-500">+{m.skills.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                            <Icon name="pencil" size={14} />
                          </button>
                          <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400">
                            <Icon name="trash-2" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Team Member' : 'Edit Team Member'} wide>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    placeholder="Senior Engineer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Experience Level</label>
                <select
                  value={form.experience}
                  onChange={e => setForm({ ...form, experience: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm"
                >
                  {EXPERIENCE.map(e => <option key={e} value={e}>{e}</option>)}
                </select> 
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Skills & Proficiency</label>
                <SkillEditor skills={form.skills} onChange={skills => setForm({ ...form, skills })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button onClick={save} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100">
                  {modal === 'add' ? 'Add Member' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // Projects Tab
    function ProjectsTab({ projects, onUpdate, onSelectProject, selectedId }) {
      const [modal, setModal] = useState(null);
      const [form, setForm] = useState({
        name: '', department: '', targetRoles: '', skills: []
      });

      const openAdd = () => {
        setForm({ name: '', department: '', targetRoles: '', skills: [] });
        setModal('add');
      };

      const openEdit = (p) => {
        setForm({
          ...p,
          targetRoles: (p.targetRoles || []).join(', '),
          skills: [...(p.skills || [])]
        });
        setModal(p);
      };

      const save = () => {
        if (!form.name.trim()) return;
        const payload = {
          name: form.name.trim(),
          department: form.department.trim(),
          targetRoles: form.targetRoles.split(',').map(s => s.trim()).filter(Boolean),
          skills: form.skills
        };
        let next;
        if (modal === 'add') {
          const newP = { ...payload, id: 'p_' + Date.now() };
          next = [...projects, newP];
        } else {
          next = projects.map(p => p.id === modal.id ? { ...payload, id: modal.id } : p);
        }
        onUpdate(next);
        setModal(null);
      };

      const remove = (id) => {
        if (!confirm('Delete this project?')) return;
        onUpdate(projects.filter(p => p.id !== id));
      };

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Projects</h2>
              <p className="text-sm text-gray-400">{projects.length} active projects</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition">
              <Icon name="plus" size={16} /> New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 && (
              <div className="col-span-full glass rounded-xl p-12 text-center text-gray-500">
                No projects yet. Create one to start matching skills.
              </div>
            )}
            {projects.map(p => (
              <div
                key={p.id}
                className={`glass rounded-xl p-5 cursor-pointer transition hover:border-white/20 ${selectedId === p.id ? 'ring-1 ring-blue-500/50 border-blue-500/30' : ''}`}
                onClick={() => onSelectProject(p.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{p.department || '—'}</p>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                      <Icon name="pencil" size={14} />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400">
                      <Icon name="trash-2" size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(p.targetRoles || []).map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 text-xs">{r}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {(p.skills || []).length} skill requirements · {(p.skills || []).filter(s => s.priority === 'Must-Have').length} must-have
                </div>
              </div>
            ))}
          </div>

          <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Create Project' : 'Edit Project'} wide>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    placeholder="LLM Inference Platform"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    placeholder="AI Platform"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Target Role(s) <span className="text-gray-600">(comma-separated)</span></label>
                <input
                  type="text"
                  value={form.targetRoles}
                  onChange={e => setForm({ ...form, targetRoles: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm"
                  placeholder="Senior ML Engineer, MLOps Engineer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Skill Requirements</label>
                <ProjectSkillEditor skills={form.skills} onChange={skills => setForm({ ...form, skills })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button onClick={save} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100">
                  {modal === 'add' ? 'Create Project' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // Matching Matrix Tab
    function MatchingMatrix({ team, projects, selectedProjectId, onSelectProject }) {
      const [sortKey, setSortKey] = useState('score');
      const [sortDir, setSortDir] = useState('desc');
      const [filter, setFilter] = useState('all'); // all | high | med | low
      const [expanded, setExpanded] = useState({});
      const [search, setSearch] = useState('');

      const project = projects.find(p => p.id === selectedProjectId) || projects[0];

      const results = useMemo(() => {
        if (!project) return [];
        return team.map(m => {
          const match = calculateMatch(m, project);
          return { member: m, ...match };
        });
      }, [team, project]);

      const sorted = useMemo(() => {
        let list = [...results];
        if (filter === 'high') list = list.filter(r => r.score >= 85);
        else if (filter === 'med') list = list.filter(r => r.score >= 60 && r.score < 85);
        else if (filter === 'low') list = list.filter(r => r.score < 60);

        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(r =>
            r.member.name.toLowerCase().includes(q) ||
            r.member.role.toLowerCase().includes(q)
          );
        }

        list.sort((a, b) => {
          let av, bv;
          if (sortKey === 'score') { av = a.score; bv = b.score; }
          else if (sortKey === 'name') { av = a.member.name; bv = b.member.name; }
          else if (sortKey === 'role') { av = a.member.role; bv = b.member.role; }
          else if (sortKey === 'missing') { av = a.missing.length; bv = b.missing.length; }
          else { av = a.score; bv = b.score; }

          if (typeof av === 'string') {
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
          }
          return sortDir === 'asc' ? av - bv : bv - av;
        });
        return list;
      }, [results, sortKey, sortDir, filter, search]);

      const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir(key === 'name' || key === 'role' ? 'asc' : 'desc'); }
      };

      const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
      };

      const exportCSV = () => {
        if (!project) return;
        const headers = ['Rank', 'Name', 'Role', 'Experience', 'Match %', 'Matched Skills', 'Missing Skills'];
        const rows = sorted.map((r, i) => [
          i + 1,
          r.member.name,
          r.member.role,
          r.member.experience,
          r.score,
          r.matched.map(s => s.name).join('; '),
          r.missing.map(s => s.name).join('; ')
        ]);
        const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skill-match-${project.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      };

      if (projects.length === 0) {
        return (
          <div className="glass rounded-xl p-12 text-center text-gray-500">
            Create a project first to see skill matches.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Skill Match Matrix</h2>
              <p className="text-sm text-gray-400">
                Ranked suitability for <span className="text-white font-medium">{project?.name}</span>
              </p>
            </div>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition">
              <Icon name="download" size={16} /> Export CSV
            </button>
          </div>

          {/* Project selector pills */}
          <div className="flex flex-wrap gap-2">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  (selectedProjectId || projects[0]?.id) === p.id
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or role..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
              />
            </div>
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
              {[
                { id: 'all', label: 'All' },
                { id: 'high', label: 'High' },
                { id: 'med', label: 'Medium' },
                { id: 'low', label: 'Low' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    filter === f.id ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr className="border-b border-white/10 text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium w-12">#</th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('score')}>
                      <span className="inline-flex items-center gap-1">Match % {sortKey === 'score' && <Icon name={sortDir === 'desc' ? 'chevron-down' : 'chevron-up'} size={14} />}</span>
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                      <span className="inline-flex items-center gap-1">Name {sortKey === 'name' && <Icon name={sortDir === 'desc' ? 'chevron-down' : 'chevron-up'} size={14} />}</span>
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('role')}>
                      <span className="inline-flex items-center gap-1">Role {sortKey === 'role' && <Icon name={sortDir === 'desc' ? 'chevron-down' : 'chevron-up'} size={14} />}</span>
                    </th>
                    <th className="px-4 py-3 font-medium">Experience</th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('missing')}>
                      <span className="inline-flex items-center gap-1">Gaps {sortKey === 'missing' && <Icon name={sortDir === 'desc' ? 'chevron-down' : 'chevron-up'} size={14} />}</span>
                    </th>
                    <th className="px-4 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        No matches found for current filters.
                      </td>
                    </tr>
                  )}
                  {sorted.map((r, idx) => (
                    <React.Fragment key={r.member.id}>
                      <tr
                        className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition"
                        onClick={() => toggleExpand(r.member.id)}
                      >
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <MatchBadge score={r.score} />
                        </td>
                        <td className="px-4 py-3 font-medium">{r.member.name}</td>
                        <td className="px-4 py-3 text-gray-300">{r.member.role}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-xs">{r.member.experience}</span>
                        </td>
                        <td className="px-4 py-3">
                          {r.missing.length === 0 ? (
                            <span className="text-emerald-400 text-xs">None</span>
                          ) : (
                            <span className="text-rose-400 text-xs">{r.missing.length} missing</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <Icon name={expanded[r.member.id] ? 'chevron-up' : 'chevron-down'} size={16} />
                        </td>
                      </tr>
                      {expanded[r.member.id] && (
                        <tr className="bg-black/40">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Matched Skills</h4>
                                {r.matched.length === 0 ? (
                                  <p className="text-gray-500 text-xs">None</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {r.matched.map((s, i) => (
                                      <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                        <span className="font-medium text-emerald-300">{s.name}</span>
                                        <span className="text-xs text-gray-400">{s.level} ≥ {s.required}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Missing / Below Required</h4>
                                {r.missing.length === 0 ? (
                                  <p className="text-gray-500 text-xs">Perfect match on all skills</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {r.missing.map((s, i) => (
                                      <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-rose-500/10 border border-rose-500/20">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-rose-300">{s.name}</span>
                                          <span className={`text-[10px] px-1 py-0.5 rounded ${s.priority === 'Must-Have' ? 'bg-rose-500/30 text-rose-200' : 'bg-blue-500/20 text-blue-300'}`}>
                                            {s.priority}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-400">Has: {s.has} · Need: {s.required}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
    // ========== BITBUCKET COLLABORATION TAB ==========

  function BitbucketCollaboration() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/.netlify/functions/bitbucket")
      .then(async response => {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Bitbucket API is not available in this Docker demo. Run with Netlify Dev or deploy to Netlify to use the function.");
        }
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Unable to load Bitbucket data");
        }
        return result;
      })
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-xl p-5">
        <p className="text-sm text-gray-400">
          Loading Bitbucket data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-5">
        <p className="text-sm text-red-400">
          {error}
        </p>
      </div>
    );
  }

  const branches = data?.branches || [];
  const pullRequests = data?.pullRequests || [];
  const contributors = data?.contributors || [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">
          Bitbucket Collaboration
        </h2>

        <p className="text-sm text-gray-400">
          Real repository activity retrieved from Bitbucket
        </p>
      </div>

      {/* Repository Information */}
      <div className="glass rounded-xl p-5">

        <div className="flex items-center gap-3 mb-4">

          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Icon
              name="git-branch"
              size={20}
              className="text-blue-400"
            />
          </div>

          <div>
            <h3 className="font-semibold">
              team-skill-matcher
            </h3>

            <p className="text-xs text-gray-500">
              Bitbucket Repository · team_skill_matching
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500">
              Branches
            </p>

            <p className="text-xl font-semibold mt-1">
              {branches.length}
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500">
              Pull Requests
            </p>

            <p className="text-xl font-semibold mt-1">
              {pullRequests.length}
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500">
              Contributors
            </p>

            <p className="text-xl font-semibold mt-1">
              {contributors.length}
            </p>
          </div>

        </div>
      </div>

      {/* Branches */}
      <div className="glass rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-white/5">

          <h3 className="font-semibold">
            Repository Branches
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Branches retrieved directly from Bitbucket
          </p>

        </div>

        <div className="divide-y divide-white/5">

          {branches.map(branch => (

            <div
              key={branch.name}
              className="px-5 py-3 flex items-center justify-between"
            >

              <div className="flex items-center gap-3">

                <Icon
                  name="git-branch"
                  size={16}
                  className="text-gray-400"
                />

                <span className="text-sm font-medium">
                  {branch.name}
                </span>

              </div>

              <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                Active
              </span>

            </div>

          ))}

        </div>
      </div>

      {/* Pull Requests */}
      <div className="glass rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-white/5">

          <h3 className="font-semibold">
            Pull Requests
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Pull requests retrieved directly from Bitbucket
          </p>

        </div>

        <div className="divide-y divide-white/5">

          {pullRequests.map(pr => (

            <div
              key={pr.id}
              className="px-5 py-4"
            >

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-medium">
                    {pr.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">

                    <span>
                      {pr.source?.branch?.name || "Unknown"}
                    </span>

                    <Icon
                      name="arrow-right"
                      size={12}
                    />

                    <span>
                      {pr.destination?.branch?.name || "Unknown"}
                    </span>

                  </div>

                </div>

                <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                  {pr.state || "UNKNOWN"}
                </span>

              </div>

            </div>

          ))}

        </div>
      </div>

      {/* Real Contributor Statistics */}
      <div className="glass rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-white/5">

          <h3 className="font-semibold">
            Real Contributor Statistics
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Contribution data calculated from actual Bitbucket commits
            and pull requests
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-white/5 text-left text-xs text-gray-500 uppercase tracking-wider">

                <th className="px-5 py-3">
                  Contributor
                </th>

                <th className="px-5 py-3">
                  Commits
                </th>

                <th className="px-5 py-3">
                  Pull Requests
                </th>

              </tr>

            </thead>

            <tbody>

              {contributors.map(contributor => (

                <tr
                  key={contributor.name}
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                >

                  <td className="px-5 py-3 font-medium">
                    {contributor.name}
                  </td>

                  <td className="px-5 py-3">
                    {contributor.commits}
                  </td>

                  <td className="px-5 py-3">
                    {contributor.pullRequests}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}


    // ========== TEAM INSIGHTS: analytics, workload, milestones, alerts and assistant ==========
    function TeamInsights({ team = [], projects = [] }) {
      const [question, setQuestion] = useState('');
      const [answer, setAnswer] = useState('Ask about skills, project gaps, workload, or next steps.');
      const [milestones, setMilestones] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tsm_milestones') || '{}'); } catch { return {}; }
      });
      const skillCounts = {};
      team.forEach(m => (m.skills || []).forEach(sk => { const key = sk.name || 'Other'; skillCounts[key] = (skillCounts[key] || 0) + 1; }));
      const topSkills = Object.entries(skillCounts).sort((a,b) => b[1]-a[1]).slice(0,8);
      const matches = projects.map(project => {
        const ranked = team.map(member => ({ member, score: calculateMatch(member, project).score, missing: calculateMatch(member, project).missing } )).sort((a,b) => b.score-a.score);
        const gaps = (project.skills || []).filter(req => !(team.some(m => (m.skills || []).some(sk => sk.name.toLowerCase() === req.name.toLowerCase() && (PROF_SCORE[sk.level] || 1) >= (PROF_SCORE[req.minLevel] || 1)))));
        return { project, ranked, gaps };
      });
      const assigned = team.map(member => ({...member, count: matches.filter(m => m.ranked[0]?.member.id === member.id).length})).sort((a,b) => a.count-b.count);
      const alerts = [];
      matches.forEach(({project,gaps}) => { if (gaps.length) alerts.push({level:'Needs attention', title: project.name, detail: `${gaps.length} required skill gap(s): ${gaps.map(g=>g.name).join(', ')}`}); });
      projects.forEach(project => { if (!milestones[project.id]) alerts.push({level:'Milestone needed', title:project.name, detail:'Add a target date and milestone in the project timeline.'}); });
      const downloadReport = () => {
        const report = { generatedAt: new Date().toISOString(), team: team.map(m=>({name:m.name,role:m.role,skills:m.skills||[]})), projects: matches.map(({project,ranked,gaps})=>({name:project.name, department:project.department, requirements:project.skills||[], topMatches:ranked.slice(0,3).map(x=>({member:x.member.name,matchPercent:Math.round(x.score),missingSkills:x.missing.map(g=>g.name)})), skillGaps:gaps.map(g=>g.name), milestone:milestones[project.id]||null})), workload:assigned.map(m=>({member:m.name,topMatchAssignments:m.count})), alerts};
        const blob = new Blob([JSON.stringify(report,null,2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='team-skill-matcher-report.json'; a.click(); URL.revokeObjectURL(url);
      };
      const ask = () => {
        const q=question.trim().toLowerCase(); if(!q) return;
        let result='I can summarize the current team and project data. Try asking about skill gaps, workload, best match, or progress.';
        if(q.includes('gap') || q.includes('missing')) result=matches.map(({project,gaps})=>`${project.name}: ${gaps.length ? gaps.map(g=>g.name).join(', ') : 'No required skill gaps detected'}`).join('\n');
        else if(q.includes('workload') || q.includes('busy') || q.includes('assign')) result=assigned.map(m=>`${m.name}: ${m.count} top-match assignment(s)`).join('\n') || 'Add team members and projects to estimate workload.';
        else if(q.includes('best') || q.includes('match')) result=matches.map(({project,ranked})=>`${project.name}: ${ranked[0] ? `${ranked[0].member.name} (${Math.round(ranked[0].score)}% match)` : 'No team members yet'}`).join('\n');
        else if(q.includes('skill')) result=`Most common skills: ${topSkills.map(([name,count])=>`${name} (${count})`).join(', ') || 'No skills added yet'}. Review the project gap list before assigning work.`;
        else if(q.includes('progress') || q.includes('report')) result=`Workspace summary: ${team.length} team members, ${projects.length} projects, ${alerts.length} alerts. This prototype tracks skills and recommendations; task completion progress needs project task data.`;
        setAnswer(result);
      };
      const card={background:'var(--panel,#fff)',border:'1px solid var(--line,#e2e8f0)',borderRadius:16,padding:18};
      return <div className="space-y-6" style={{padding:'4px 0'}}>
        <div><h2 className="text-2xl font-bold">Insights & Team Operations</h2><p className="text-sm mt-1" style={{color:'#64748b'}}>Live summaries calculated from your saved team and project data. Recommendations are rule-based, not generated by an external AI service.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[['Team members',team.length],['Projects',projects.length],['Attention items',alerts.length]].map(([label,value])=><div key={label} style={card}><div className="text-sm" style={{color:'#64748b'}}>{label}</div><div className="text-3xl font-bold mt-2">{value}</div></div>)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section style={card}><h3 className="font-bold text-lg mb-4">Skill distribution</h3>{topSkills.length ? topSkills.map(([name,count])=><div key={name} className="mb-3"><div className="flex justify-between text-sm mb-1"><span>{name}</span><span>{count} member(s)</span></div><div style={{height:8,background:'#e2e8f0',borderRadius:20,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.max(6,count/Math.max(...topSkills.map(x=>x[1]))*100)}%`,background:'#3975f6',borderRadius:20}} /></div></div>) : <p className="text-sm">Add skills to team members to see this chart.</p>}</section>
          <section style={card}><h3 className="font-bold text-lg mb-4">Project skill gaps & best matches</h3>{matches.length ? matches.map(({project,ranked,gaps})=><div key={project.id} className="py-3 border-b last:border-0" style={{borderColor:'#e2e8f0'}}><div className="font-semibold">{project.name}</div><p className="text-sm mt-1">Best match: {ranked[0] ? `${ranked[0].member.name} · ${Math.round(ranked[0].score)}%` : 'Add team members'}</p><p className="text-sm mt-1" style={{color:gaps.length?'#b45309':'#15803d'}}>{gaps.length ? `Gap(s): ${gaps.map(g=>g.name).join(', ')}` : 'Required skills covered by at least one member'}</p></div>) : <p className="text-sm">Create a project to calculate matches.</p>}</section>
          <section style={card}><h3 className="font-bold text-lg mb-4">Workload balancing suggestion</h3><p className="text-sm mb-3" style={{color:'#64748b'}}>Uses each member's count of projects where they are the top skill match as a rough workload signal—not actual task hours.</p>{assigned.length ? assigned.map(m=><div key={m.id} className="flex items-center justify-between py-2 border-b" style={{borderColor:'#e2e8f0'}}><div><div className="font-medium">{m.name}</div><div className="text-xs" style={{color:'#64748b'}}>{m.role||'Team member'}</div></div><span className="rounded-full px-3 py-1 text-sm" style={{background:m.count>1?'#fef3c7':'#dbeafe',color:m.count>1?'#92400e':'#1d4ed8'}}>{m.count} top-match project(s)</span></div>) : <p className="text-sm">Add team members first.</p>}</section>
          <section style={card}><h3 className="font-bold text-lg mb-4">Project timeline & milestones</h3><p className="text-sm mb-3" style={{color:'#64748b'}}>Set a target date for each project. Dates are saved in this browser.</p>{projects.length ? projects.map(project=><div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b" style={{borderColor:'#e2e8f0'}}><span className="font-medium">{project.name}</span><input aria-label={`Target date for ${project.name}`} type="date" value={milestones[project.id]||''} onChange={e=>{const next={...milestones,[project.id]:e.target.value};setMilestones(next);localStorage.setItem('tsm_milestones',JSON.stringify(next));}} className="border rounded-lg p-2 text-sm" /></div>) : <p className="text-sm">Create a project to set milestones.</p>}</section>
        </div>
        <section style={card}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-lg">Notifications & risk center</h3><p className="text-sm mt-1" style={{color:'#64748b'}}>Action items from missing skills and missing project target dates.</p></div><button onClick={downloadReport} className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{background:'#3975f6'}}>Download project report (JSON)</button></div>{alerts.length ? <div className="mt-4 space-y-3">{alerts.map((a,i)=><div key={i} className="rounded-xl p-3" style={{background:'#fff7ed',border:'1px solid #fed7aa'}}><div className="text-xs font-bold uppercase" style={{color:'#9a3412'}}>{a.level}</div><div className="font-semibold mt-1">{a.title}</div><div className="text-sm mt-1" style={{color:'#7c2d12'}}>{a.detail}</div></div>)}</div> : <p className="mt-4 text-sm" style={{color:'#15803d'}}>No skill-gap or milestone alerts detected.</p>}</section>
        <section style={card}><h3 className="font-bold text-lg">Project assistant</h3><p className="text-sm mt-1 mb-3" style={{color:'#64748b'}}>Ask a question about the data currently saved in this workspace.</p><div className="flex flex-col sm:flex-row gap-2"><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')ask();}} placeholder="e.g. What are the skill gaps?" className="flex-1 rounded-xl border p-3"/><button onClick={ask} className="rounded-xl px-4 py-3 font-semibold text-white" style={{background:'#3975f6'}}>Ask assistant</button></div><pre className="mt-3 rounded-xl p-4 text-sm whitespace-pre-wrap" style={{background:'#f1f5f9',color:'#1e293b',fontFamily:'inherit'}}>{answer}</pre></section>
        <p className="text-xs" style={{color:'#64748b'}}>Limitations: task completion/activity trends require task-event data not currently stored by this version. Repository health is available only when the live Bitbucket function is configured and can return real repository data. Do not treat the workload estimate as a substitute for task hours.</p>
      </div>;
    }

    // Main App Shell
    
    // Main App Shell
    function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState('dashboard');

  // Keep the remaining existing code below this
      const [selectedProjectId, setSelectedProjectId] = useState(null);
      const [ready, setReady] = useState(false);

      useEffect(() => {
        const db = getOrInitDB();
        if (db.currentUserId) {
          const u = db.users.find(x => x.id === db.currentUserId);
          if (u) {
            setUser(u);
            if (u.projects?.length) {
              setSelectedProjectId(u.projects[0].id);
            }
          }
        }
        setReady(true);
      }, []);

      const persistUser = useCallback((updated) => {
        const db = loadDB() || getOrInitDB();
        db.users = db.users.map(u => u.id === updated.id ? updated : u);
        saveDB(db);
        setUser(updated);
      }, []);

      const handleLogin = (u) => {
        setUser(u);
        setSelectedProjectId(u.projects?.[0]?.id || null);
        setTab('dashboard');
      };

      const handleLogout = () => {
        const db = loadDB();
        if (db) {
          db.currentUserId = null;
          saveDB(db);
        }
        setUser(null);
      };

      const updateTeam = (team) => {
        persistUser({ ...user, team });
      };

      const updateProjects = (projects) => {
        persistUser({ ...user, projects });

        if (
          selectedProjectId &&
          !projects.find(p => p.id === selectedProjectId)
        ) {
          setSelectedProjectId(projects[0]?.id || null);
        }
      };

      if (!ready) {
        return (
          <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: '#0b1220', color: '#e5e7eb' }}
          >
            Loading Team Skill Matcher...
          </div>
        );
      }

      if (!user) {
        return <AuthPage onLogin={handleLogin} />;
      }

      const tabs = [
        { id: 'dashboard', label: 'Dashboard', symbol: '⌂' },
        { id: 'match', label: 'Skill Match', symbol: '◎' },
        { id: 'team', label: 'Team Roster', symbol: '♙' },
        { id: 'projects', label: 'Projects', symbol: '▤' },
        { id: 'bitbucket', label: 'Bitbucket', symbol: '⑂' },
        { id: 'insights', label: 'Insights & Reports', symbol: '▥' }
      ];

      const selectedProject = (user.projects || []).find(
        p => p.id === selectedProjectId
      );

      const pageTitle =
        tabs.find(t => t.id === tab)?.label || 'Dashboard';

      return (
        
<div
  data-theme={darkMode ? 'dark' : 'light'}
  className="min-h-screen flex flex-col md:flex-row app-theme-root"
  style={{
    background: darkMode ? '#0b1220' : '#f3f6fc',
    color: darkMode ? '#e5e7eb' : '#172033',
    colorScheme: darkMode ? 'dark' : 'light'
  }}
>

          {/* Sidebar */}
          <aside
            className="md:w-64 md:min-h-screen flex-shrink-0 flex flex-col"
            style={{ background: '#14213d', color: '#ffffff' }}
          >
            <div className="px-6 py-7 flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ background: '#3975f6' }}
              >
                T
              </div>

              <div>
                <div className="font-bold text-base">
                  Team Skill Matcher
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: '#aebbd3' }}
                >
                  {user.orgName || 'Team Workspace'}
                </div>
              </div>
            </div>

            <div className="px-4 mt-2">
              <div
                className="uppercase text-xs font-semibold tracking-widest px-3 mb-3"
                style={{ color: '#8293b3' }}
              >
                Workspace
              </div>

              <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    aria-current={tab === t.id ? 'page' : undefined}
                    className="flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left"
                    style={{
                      background:
                        tab === t.id ? '#3975f6' : 'transparent',
                      color:
                        tab === t.id ? '#ffffff' : '#c4cde0'
                    }}
                  >
                    <span
                      className="text-xl w-6 text-center"
                      aria-hidden="true"
                    >
                      {t.symbol}
                    </span>
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="hidden md:block mt-auto p-5">
              <div
                className="rounded-xl p-4"
                style={{ background: '#1d2e50' }}
              >
                <div className="text-sm font-semibold">
                  Team Workspace
                </div>
                <p
                  className="text-xs mt-2 leading-5"
                  style={{ color: '#b7c3d8' }}
                >
                  Manage skills, projects and collaboration in one place.
                </p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <header
              className="sticky top-0 z-30 border-b px-5 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3"
              
style={{
  background: darkMode ? '#111827' : 'rgba(255,255,255,0.96)',
  borderColor: darkMode ? '#334155' : '#e3e9f2'
}}

            >
              <div>
                <div
                  className="text-xs mb-1"
                  style={{ color: '#71809a' }}
                >
                  WORKSPACE / {pageTitle.toUpperCase()}
                </div>
                <h1 className="text-xl font-bold">{pageTitle}</h1>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center font-bold"
                  style={{ background: '#dbeafe', color: '#1d4ed8' }}
                >
                  {(user.email || 'U').charAt(0).toUpperCase()}
                </div>

                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold">
                    {user.email}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: '#71809a' }}
                  >
                    Workspace member
                  </div>
                </div>

                
<button
  onClick={() => setDarkMode(!darkMode)}
  className="px-4 py-2 rounded-lg text-sm font-semibold border"
  style={{
    background: darkMode ? '#334155' : '#ffffff',
    borderColor: darkMode ? '#475569' : '#dce4f0',
    color: darkMode ? '#ffffff' : '#334155'
  }}
>
  {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
</button>

<button
  onClick={handleLogout}
  className="px-4 py-2 rounded-lg text-sm font-semibold border"
  style={{
    background: darkMode ? '#172033' : '#ffffff',
    borderColor: darkMode ? '#475569' : '#dce4f0',
    color: darkMode ? '#ffffff' : '#334155'
  }}
>
  Logout
</button>

              </div>
            </header>

            <main className="p-4 md:p-8 max-w-screen-2xl mx-auto">

              {/* Dashboard */}
              {tab === 'dashboard' && (
                <div className="space-y-7">
                  <section
                    className="rounded-2xl p-6 md:p-8 text-white"
                    style={{
                      background:
                        'linear-gradient(120deg, #1d4ed8, #4f46e5)',
                      boxShadow:
                        '0 12px 30px rgba(37,99,235,0.15)'
                    }}
                  >
                    <div
                      className="text-sm mb-3"
                      style={{ color: '#dbeafe' }}
                    >
                      TEAM OVERVIEW
                    </div>

                    
<h2 className="text-2xl md:text-3xl font-bold">
  Welcome back, {user.name || user.email || 'Team Member'}!
</h2>


                    <p
                      className="mt-3 text-sm md:text-base leading-6"
                      style={{ color: '#e0e7ff' }}
                    >
                      Find the right people for each project using
                      team skills and project requirements.
                    </p>

                    <button
                      onClick={() => setTab('match')}
                      className="mt-5 rounded-lg px-5 py-3 text-sm font-bold"
                      style={{
                        background: darkMode ? '#2563eb' : '#1d4ed8',
                        color: '#ffffff',
                        borderColor: darkMode ? '#3b82f6' : '#1d4ed8',
                      }}
                    >
                      Explore Skill Matches →
                    </button>
                  </section>

                  {/* Statistics */}
                  <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div
  className="rounded-2xl border p-6"
  style={{
    background: darkMode ? '#172033' : '#ffffff',
    borderColor: darkMode ? '#334155' : '#e3e9f2'
  }}
>
  <div
    className="text-sm font-medium"
    style={{
      color: darkMode ? '#cbd5e1' : '#64748b'
    }}
  >
    Total Team Members
  </div>
                      <div
  className="text-4xl font-bold mt-4"
  style={{
    color: darkMode ? '#f8fafc' : '#172033'
  }}
>
  {(user.team || []).length}
</div>

                      <div
                        className="text-xs mt-3"
                        style={{
  color: darkMode ? '#cbd5e1' : '#64748b'
}}
                      >
                        Members in your workspace
                      </div>
                    </div>

                    <div
                      className="rounded-2xl border p-6"
                      style={{
                        background: darkMode ? '#172033' : '#ffffff',
borderColor: darkMode ? '#334155' : '#e3e9f2'
                      }}
                    >
                      <div
                        className="text-sm font-medium"
                        style={{ color: darkMode ? '#cbd5e1' : '#64748b' }}
                      >
                        Total Projects
                      </div>

                      <div
                        className="text-4xl font-bold mt-4"
                        style={{
                          color: darkMode ? '#f8fafc' : '#172033'
                        }}
                      >
                        {(user.projects || []).length}
                      </div>

                      <div
                        className="text-xs mt-3"
                        style={{
  color: darkMode ? '#cbd5e1' : '#64748b'
}}
                      >
                        Projects available for matching
                      </div>
                    </div>

                    <div
                      className="rounded-2xl border p-6"
                      style={{
                        background: darkMode ? '#172033' : '#ffffff',
borderColor: darkMode ? '#334155' : '#e3e9f2'
                      }}
                    >
                      <div
                        className="text-sm font-medium"
                       style={{ color: darkMode ? '#cbd5e1' : '#64748b' }}
                      >
                        Selected Project
                      </div>

                      <div
                        className="text-lg font-bold mt-4 break-words"
                        style={{
                          color: darkMode ? '#f8fafc' : '#172033'
                        }}
                      >
                        {selectedProject?.name || 'No project selected'}
                      </div>

                      <button
                        onClick={() => setTab('projects')}
                        className="text-sm font-semibold mt-3"
                        style={{
  color: darkMode ? '#cbd5e1' : '#64748b'
}}
                      >
                        View projects →
                      </button>
                    </div>
                  </section>

<div
  className="rounded-2xl border p-6"
  style={{
    background: darkMode ? '#172033' : '#ffffff',
borderColor: darkMode ? '#334155' : '#e3e9f2'
  }}
>
  <div
    className="text-sm font-medium"
   style={{ color: darkMode ? '#cbd5e1' : '#64748b' }}
  >
    Total Team Skills
  </div>

  <div
  className="text-4xl font-bold mt-4"
  style={{
    color: darkMode ? '#f8fafc' : '#172033'
  }}
>
  {[...new Set(
    (user.team || []).flatMap(member =>
      (member.skills || []).map(skill =>
        typeof skill === 'string' ? skill : skill.name
      )
    ).filter(Boolean)
  )].length}
</div>

  <div
    className="text-xs mt-3"
    style={{
  color: darkMode ? '#cbd5e1' : '#64748b'
}}
  >
    Unique skills across team members
  </div>
</div>


                  {/* Quick actions */}
                  <section>
                    <div className="mb-4">
                      <h2
  className="text-xl font-bold"
  style={{ color: darkMode ? '#f8fafc' : '#172033' }}
>
  Quick Actions
</h2>
                      <p
  className="text-sm mt-1"
  style={{ color: darkMode ? '#cbd5e1' : '#64748b' }}
>
  Choose what you want to work on next.
</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {[
                        {
                          id: 'match',
                          title: 'Skill Matching',
                          desc: 'Compare member skills with project needs.',
                          symbol: '◎'
                        },
                        {
                          id: 'team',
                          title: 'Manage Team',
                          desc: 'Review and update team member skills.',
                          symbol: '♙'
                        },
                        {
                          id: 'projects',
                          title: 'Manage Projects',
                          desc: 'Maintain project requirements.',
                          symbol: '▤'
                        },
                        {
                          id: 'bitbucket',
                          title: 'Bitbucket',
                          desc: 'Open your collaboration workspace.',
                          symbol: '⑂'
                        }
                      ].map(action => (
                        <button
                          key={action.id}
                          onClick={() => setTab(action.id)}
                          className="text-left rounded-2xl border p-5"
                          style={{
                           background: darkMode ? '#172033' : '#ffffff',
borderColor: darkMode ? '#334155' : '#e3e9f2'
                          }}
                        >
                          <span
                            className="inline-flex w-11 h-11 rounded-xl items-center justify-center text-2xl mb-4"
                            style={{
                              background: darkMode ? '#172033' : '#ffffff',
borderColor: darkMode ? '#334155' : '#e3e9f2'
                            }}
                          >
                            {action.symbol}
                          </span>

                          <div className="font-bold">
                            {action.title}
                          </div>

                          <p
  className="text-sm"
  style={{
    color: darkMode ? '#cbd5e1' : '#64748b'
  }}
>
  {action.desc}
</p>

                          <div
                            className="text-sm font-semibold mt-4"
                            style={{ color: '#2563eb' }}
                          >
                            Open section →
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* Skill Match */}
              {tab === 'match' && (
                <MatchingMatrix
                  team={user.team || []}
                  projects={user.projects || []}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                />
              )}

              {/* Team Roster */}
              {tab === 'team' && (
                <TeamRoster
                  team={user.team || []}
                  onUpdate={updateTeam}
                />
              )}

              {/* Projects */}
              {tab === 'projects' && (
                <ProjectsTab
                  projects={user.projects || []}
                  onUpdate={updateProjects}
                  onSelectProject={setSelectedProjectId}
                  selectedId={selectedProjectId}
                />
              )}

              {/* Bitbucket */}
              {tab === 'bitbucket' && (
                <BitbucketCollaboration />
              )}

              {/* Insights, workload, milestones, notifications and report */}
              {tab === 'insights' && (
                <TeamInsights team={user.team || []} projects={user.projects || []} />
              )}

              <footer
                className="mt-10 pt-5 border-t text-xs"
                style={{
                  borderColor: '#e3e9f2',
                  color: '#8190a5'
                }}
              >
                Team Skill Matcher · Team collaboration and skill-based
                project matching
              </footer>
            </main>
          </div>
        </div>
      );
    }

    // Mount the React application
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
