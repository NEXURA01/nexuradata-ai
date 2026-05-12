# NEXURA Master Visual Style System

This is the exact visual execution contract for NEXURA public interfaces. It is not inspiration or loose direction.

## Overall Feel

The website must feel premium, calm, structured, operational, intelligent, minimal, and alive.

It must not feel like startup SaaS, crypto, AI hype, neon cyberpunk, gaming UI, glassmorphism overload, or a colorful gradient template.

The target feeling is high-end operational infrastructure: command systems, enterprise control rooms, modern architecture, and premium industrial systems.

## Color System

Primary background:

```css
#0B0D10
```

Secondary background for cards, panels, dashboards, and sections:

```css
#13161B
```

Tertiary background for hover, active, and elevated states:

```css
#1B2027
```

Primary text:

```css
#F5F7FA
```

Secondary text:

```css
#A7B0BC
```

Muted text:

```css
#6B7280
```

Only accent:

```css
#C17C45
```

Use copper only for CTA buttons, highlights, active indicators, and topology nodes.

Never use neon green, bright blue, purple gradients, rainbow effects, vibrant startup colors, or multiple accent colors.

## Typography

Headlines use Inter Tight or Satoshi. Body text uses Inter.

Typography must feel engineered, precise, modern, and premium.

Hero title:

```css
font-size: 72px;
font-weight: 700;
line-height: 0.95;
```

Tablet hero title: 48px. Mobile hero title: 38px.

Section titles:

```css
font-size: 42px;
font-weight: 600;
```

Body text:

```css
font-size: 18px;
line-height: 1.7;
```

## Spacing

The site must breathe.

Section rhythm:

```css
padding-top: 140px;
padding-bottom: 140px;
```

Card padding:

```css
padding: 32px;
```

Grid gap:

```css
gap: 32px;
```

Maximum content width:

```css
max-width: 1280px;
```

## Layout

Never center everything. Use asymmetry, structured grids, and left alignment.

Hero layout:

- left side: title, subtitle, CTA
- right side: topology animation, dashboard preview, or operational visualization

Every section follows this structure:

```txt
title
short explanation
grid or visual
```

Alternate section rhythm where possible: text left / visual right, then visual left / text right.

## Cards

Cards use:

```css
background: #13161B;
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 24px;
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
```

Card hover is limited to slight elevation, subtle border glow, and tiny movement. No large scaling or flashy effects.

## Buttons

Primary button:

```css
background: #C17C45;
color: #0B0D10;
border-radius: 14px;
height: 56px;
padding-inline: 28px;
font-weight: 600;
```

Hover uses only slight brightness and a `translateY(-1px)` movement.

Secondary buttons are transparent:

```css
border: 1px solid rgba(255, 255, 255, 0.12);
background: rgba(255, 255, 255, 0.02);
```

## Hero

Hero height is at least one viewport high.

Hero background may use a dark gradient, subtle topology, very soft texture, and operational lines.

Do not use giant illustrations, stock photos, bright blobs, or AI robot imagery.

Hero visual should feel like an operational routing system with nodes, thin lines, slow movement, dashboard fragments, and synchronization pulses.

## Topology

Lines are very thin:

```css
rgba(255, 255, 255, 0.08)
```

Nodes are small 6px to 10px circles using copper:

```css
#C17C45
```

Movement is very slow: pulses, routing flows, and synchronization only. No particle fields, fast motion, or flashy effects.

## Dashboard Style

Dashboards must feel real, not decorative. Use workflow timelines, status indicators, queue states, activity feeds, and operational alerts.

Dashboard colors are dark gray, muted text, and small copper accents only.

Use operational wording such as Synchronization Stable, Workflow Active, Queue Operational, and Infrastructure Online.

## Animation

Animation must feel infrastructural.

Allowed: slow movement, tiny transitions, opacity fades, routing pulses, and soft topology motion.

Forbidden: bouncing, large scaling, aggressive parallax, spin animations, floating cards everywhere, and aggressive glow.

## Iconography And Imagery

Use thin line icons from systems such as Lucide or Phosphor when icons are needed.

Do not use smiling business stock photos, AI robots, random abstract blobs, or generic startup imagery.

Use dashboards, operational diagrams, topology, workflows, and infrastructure visuals.

## Backgrounds

Backgrounds need depth, layering, and atmosphere through gradients, radial fades, and subtle topology overlays. Do not use a flat black page.

## Mobile

On mobile, reduce motion, stack sections vertically, keep generous spacing, and preserve strong typography. Do not cram content.

## Final Test

The site should feel like an operational infrastructure environment, not an AI startup template.

Reference direction: Linear, Vercel, Palantir, Stripe, modern mission control systems, and high-end enterprise software, but darker, calmer, more infrastructural, and more operational.
