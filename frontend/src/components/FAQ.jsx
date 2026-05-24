import { useState, useRef, useEffect } from 'react';

const FAQS = [
  {
    q: 'What is CreatoKite?',
    a: 'CreatoKite is a platform that connects creators with brands for collaboration opportunities.',
  },
  {
    q: 'Who can join CreatoKite?',
    a: 'Any content creator, influencer, or creator looking for collaboration opportunities can join.',
  },
  {
    q: 'What is the minimum followers required?',
    a: 'Creators with at least 1,000 followers can join and apply for collaborations.',
  },
  {
    q: 'Are collaborations paid?',
    a: 'Collaborations may be paid or unpaid depending on the brand campaign requirements.',
  },
  {
    q: 'How does matching work?',
    a: 'CreatoKite matches creators and brands based on audience, niche, engagement, and campaign needs.',
  },
  {
    q: 'Is it free to join?',
    a: 'Yes, joining CreatoKite is completely free for creators.',
  },
  {
    q: 'How will I know if I am selected?',
    a: 'You will receive notifications or updates when a brand selects you for a collaboration.',
  },
  {
    q: 'Can beginners join?',
    a: 'Yes, beginners who meet the minimum requirements can join.',
  },
];

function FAQItem({ item, index, isOpen, onToggle }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      onClick={onToggle}
      style={{
        background: isOpen
          ? 'linear-gradient(135deg, rgba(108,99,255,0.07), rgba(0,217,255,0.03))'
          : 'rgba(255,255,255,0.02)',
        border: isOpen
          ? '1px solid rgba(108,99,255,0.35)'
          : '1px solid var(--border)',
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
        boxShadow: isOpen ? '0 4px 24px rgba(108,99,255,0.12)' : 'none',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = 'rgba(108,99,255,0.25)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
        }
      }}
      onMouseLeave={e => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }
      }}
    >
      {/* Question row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '18px 20px',
        }}
      >
        {/* Index badge */}
        <span
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 8,
            background: isOpen
              ? 'linear-gradient(135deg, var(--p), var(--acc))'
              : 'rgba(255,255,255,0.05)',
            border: isOpen ? 'none' : '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: isOpen ? '#fff' : 'var(--t3)',
            transition: 'all 0.25s',
            fontFamily: 'var(--fd)',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Question text */}
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            color: isOpen ? 'var(--t1)' : 'var(--t2)',
            fontFamily: 'var(--fd)',
            lineHeight: 1.4,
            transition: 'color 0.2s',
          }}
        >
          {item.q}
        </span>

        {/* Toggle icon */}
        <span
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 8,
            background: isOpen
              ? 'rgba(108,99,255,0.2)'
              : 'rgba(255,255,255,0.04)',
            border: isOpen
              ? '1px solid rgba(108,99,255,0.4)'
              : '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: isOpen ? 'var(--p2)' : 'var(--t3)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            lineHeight: 1,
          }}
        >
          +
        </span>
      </div>

      {/* Answer — animated height */}
      <div
        style={{
          height: height,
          overflow: 'hidden',
          transition: 'height 0.32s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          ref={bodyRef}
          style={{
            padding: '0 20px 18px 60px',
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: 'var(--t2)',
              lineHeight: 1.7,
            }}
          >
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (i) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  const half = Math.ceil(FAQS.length / 2);
  const left = FAQS.slice(0, half);
  const right = FAQS.slice(half);

  return (
    <section
      style={{
        padding: '90px 40px',
        background: 'var(--s1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 700,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(108,99,255,0.06), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--acc)',
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Got Questions?
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              fontFamily: 'var(--fd)',
              fontWeight: 800,
              marginBottom: 12,
              color: 'var(--t1)',
            }}
          >
            Frequently Asked{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--p2), var(--acc))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Questions
            </span>
          </h2>
          <p
            style={{
              color: 'var(--t2)',
              maxWidth: 420,
              margin: '0 auto',
              fontSize: 14,
            }}
          >
            Everything you need to know about Creatokite. Can't find an answer?{' '}
            <span
              style={{
                color: 'var(--p2)',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Reach out to us.
            </span>
          </p>
        </div>

        {/* Two-column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 12,
            alignItems: 'start',
          }}
        >
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {left.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => handleToggle(i)}
              />
            ))}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {right.map((item, i) => {
              const gi = i + half;
              return (
                <FAQItem
                  key={gi}
                  item={item}
                  index={gi}
                  isOpen={openIndex === gi}
                  onToggle={() => handleToggle(gi)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
