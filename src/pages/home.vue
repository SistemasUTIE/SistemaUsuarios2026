<template>
  <q-page class="home-page">
    <section class="home-welcome" aria-labelledby="home-title">
      <img
        class="home-welcome__logo"
        src="../assets/IEEN300.png"
        alt="Instituto Estatal Electoral de Nayarit"
      />

      <div class="home-welcome__copy">
        <span class="home-welcome__eyebrow">Universo IEEN</span>
        <h1 id="home-title">Sistema de usuarios</h1>
        <p>Gestión institucional de usuarios, perfiles y sistemas.</p>
      </div>
    </section>
  </q-page>
</template>

<style scoped>
.home-page {
  display: grid;
  min-height: calc(100vh - 68px);
  place-items: center;
  padding: clamp(20px, 4vw, 44px);
  background: linear-gradient(180deg, var(--ieen-page-top) 0%, var(--ieen-page-bottom) 100%);
  color: var(--ieen-text);
}

.home-welcome {
  position: relative;
  display: grid;
  justify-items: center;
  width: min(100%, 900px);
  gap: 28px;
  padding: clamp(28px, 5vw, 60px);
  overflow: hidden;
  border: 1px solid var(--ieen-border);
  border-radius: 24px;
  background: var(--ieen-surface);
  box-shadow: var(--ieen-shadow-card);
  text-align: center;
}

.home-welcome::before {
  position: absolute;
  inset: 0 0 auto;
  height: 6px;
  background: var(--ieen-brand-gradient);
  content: '';
}

.home-welcome__logo {
  display: block;
  width: min(100%, 620px);
  height: auto;
  object-fit: contain;
}

.home-welcome__copy {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.home-welcome__eyebrow {
  color: var(--ieen-brand);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-welcome h1 {
  margin: 0;
  color: var(--ieen-text);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  line-height: 1.2;
}

.home-welcome p {
  margin: 0;
  color: var(--ieen-text-muted);
  font-size: 0.98rem;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .home-page {
    min-height: calc(100vh - 60px);
    padding: 18px;
  }

  .home-welcome {
    gap: 20px;
    padding: 30px 22px;
    border-radius: 18px;
  }
}
</style>
