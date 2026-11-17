"use client";
import { T } from "./preferences";
import { useState, useRef, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  Users,
  CalendarDays,
  Wallet,
  ClipboardCheck,
  Globe,
  Shield,
} from "lucide-react";
import { FieldFeature } from "./club-life";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { money, feeFor, seed, type DB } from "@/lib/courvix";
export const modules = [
  {
    icon: Users,
    title: "Member & tim",
    text: "Profil member, kelompok latihan, status keanggotaan, serta penugasan coach dalam satu tempat.",
    detail:
      "Susun roster berdasarkan usia, level, atau program. Telusuri data member tanpa mencari ulang di percakapan grup.",
  },
  {
    icon: CalendarDays,
    title: "Training schedule",
    text: "Set the session agenda, venue, coach and participating group.",
    detail:
      "Lihat jadwal dalam kalender atau agenda. Semua sesi terhubung dengan tim agar pengurus lebih mudah mengatur kegiatan.",
  },
  {
    icon: ClipboardCheck,
    title: "Absensi yang rapi",
    text: "Catat kehadiran per sesi dan lihat riwayat aktivitas setiap member.",
    detail:
      "Coach bisa mencatat hadir, izin, sakit, atau absen. Evaluasi konsistensi latihan dengan riwayat yang mudah ditelusuri.",
  },
  {
    icon: Wallet,
    title: "Invoices & payments",
    text: "Track dues, invoice status and transaction history.",
    detail:
      "The demo covers manual transfers, reference submissions, administrator review and reminders. No money is moved.",
  },
  {
    icon: Shield,
    title: "Peran yang jelas",
    text: "Ruang kerja untuk administrator, admin klub, coach, dan member.",
    detail:
      "Coba sudut pandang tiap peran melalui demo. Penerapan akses dan akun klub produksi disesuaikan saat implementasi.",
  },
  {
    icon: Globe,
    title: "Identitas digital klub",
    text: "Kelola profil klub dan rencanakan website atau sistem khusus sesuai kebutuhan.",
    detail:
      "Dari halaman publik klub sampai alur operasional khusus, identitas klub tetap menjadi pusat pengalaman.",
  },
];
export function Intro({
  label,
  title,
  accent,
  text,
}: {
  label: string;
  title: string;
  accent: string;
  text: string;
}) {
  return (
    <section className="cv-intro">
      <div className="cv-eyebrow">{label}</div>
      <h1>
        {title}
        <br />
        <em>{accent}</em>
      </h1>
      <p>{text}</p>
    </section>
  );
}
export function CTA() {
  return (
    <section className="cv-cta">
      <div>
        <div className="cv-eyebrow">
          <T>{"YOUR NEXT CHAPTER STARTS HERE"}</T>
        </div>
        <h2>
          <T>{"SIAP MEMBAWA"}</T>
          <br />
          <T>{"KLUBMU "}</T>
          <span>
            <T>{"NAIK KELAS?"}</T>
          </span>
        </h2>
      </div>
      <div>
        <p>
          <T>{"Try the workflow. Discover what your club needs."}</T>
          <br />
          <T>{"Bangun langkah berikutnya bersama Courvix."}</T>
        </p>
        <a className="cv-button dark" href="/demo">
          <T>{"Masuk ke demo "}</T>
          <ArrowUpRight />
        </a>
      </div>
    </section>
  );
}
export function HomeSections() {
  return (
    <>
      <section className="cv-section cv-onboarding">
        <div>
          <div className="cv-eyebrow">
            <T>{"FROM SIGN-UP TO TEAMWORK"}</T>
          </div>
          <h2>
            <T>{"KLUBMU SIAP."}</T>
            <br />
            <em>
              <T>{"TIMMU TERHUBUNG."}</T>
            </em>
          </h2>
          <p>
            <T>
              {
                "Daftarkan klub sendiri, pilih paket, lalu undang orang-orang di balik setiap latihan. Setiap klub punya ruangnya sendiri."
              }
            </T>
          </p>
          <div className="cv-actions">
            <a className="cv-button" href="/register">
              <T>{"Register your club "}</T>
              <ArrowUpRight />
            </a>
            <a className="cv-textlink" href="/join">
              <T>{"Have an invitation code?"}</T>
            </a>
          </div>
        </div>
        <div className="cv-onboarding-flow">
          {[
            [
              "01",
              "CREATE YOUR CLUB",
              "Create a workspace and start a 14-day trial.",
            ],
            [
              "02",
              "BRING YOUR PEOPLE",
              "A single-use code for coaches and members.",
            ],
            [
              "03",
              "GET IN THE GAME",
              "Open your workspace and run your first session.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <b>{n}</b>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
              <Check />
            </article>
          ))}
        </div>
      </section>
      <section className="cv-section">
        <div className="cv-section-head">
          <div>
            <div className="cv-eyebrow">
              <T>{"01 / THE CLUB OPERATING SYSTEM"}</T>
            </div>
            <h2>
              <T>{"LEBIH SEDIKIT ADMIN."}</T>
              <br />
              <em>
                <T>{"LEBIH BANYAK AKSI."}</T>
              </em>
            </h2>
          </div>
          <p>
            <T>
              {
                "Energi pengurus seharusnya untuk mengembangkan klub. Courvix menyatukan pekerjaan hariannya."
              }
            </T>
          </p>
        </div>
        <div className="cv-featuregrid">
          {modules.slice(0, 3).map((m, i) => (
            <a href="/platform" className="cv-feature" key={m.title}>
              <div className="cv-feature-top">
                <m.icon />
                <span>0{i + 1}</span>
              </div>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <span className="cv-textlink">
                <T>{"Lihat cara kerjanya "}</T>
                <ArrowUpRight size={17} />
              </span>
            </a>
          ))}
        </div>
      </section>
      <section className="cv-orange cv-section cv-split">
        <div>
          <div className="cv-eyebrow">
            <T>{"02 / EVERY PART CONNECTED"}</T>
          </div>
          <h2>
            <T>{"SATU KLUB."}</T>
            <br />
            <T>{"SATU RITME."}</T>
            <br />
            <span className="cv-white">
              <T>{"SATU COURVIX."}</T>
            </span>
          </h2>
          <p>
            <T>
              {
                "Dari roster ke lapangan, lalu ke laporan pembayaran. Semuanya punya tempat dan alur yang jelas."
              }
            </T>
          </p>
          <a href="/platform" className="cv-button dark">
            <T>{"Jelajahi fitur "}</T>
            <ArrowUpRight />
          </a>
        </div>
        <div className="cv-product">
          <div className="cv-product-head">
            <strong>
              <T>{"courvix."}</T>
            </strong>
            <span>
              <T>{"PREVIEW DEMO"}</T>
            </span>
          </div>
          <div className="cv-product-body">
            <small>
              <T>{"BATAM BASKETBALL CLUB"}</T>
            </small>
            <h3>
              <T>{"LET’S GET TO WORK."}</T>
            </h3>
            <div className="cv-metrics">
              <div>
                <span>
                  <T>{"Registered members"}</T>
                </span>
                <b>520</b>
              </div>
              <div>
                <span>
                  <T>{"Monthly dues"}</T>
                </span>
                <b>
                  350
                  <span>
                    <T>{"rb"}</T>
                  </span>
                </b>
              </div>
            </div>
            <div className="cv-training">
              <span className="cv-day">
                24
                <br />
                <small>
                  <T>{"SEP"}</T>
                </small>
              </span>
              <div>
                <strong>
                  <T>{"U-18 Performance"}</T>
                </strong>
                <p>
                  <T>{"Latihan sore · 16.00–18.00"}</T>
                </p>
              </div>
              <ClipboardCheck />
            </div>
            <div className="cv-minirow">
              <span>
                <T>{"Group roster"}</T>
              </span>
              <b>
                <T>{"Ready to train ↗"}</T>
              </b>
            </div>
            <div className="cv-minirow">
              <span>
                <T>{"Invoices & history"}</T>
              </span>
              <b>
                <T>{"Satu tempat ↗"}</T>
              </b>
            </div>
          </div>
        </div>
      </section>
      <section className="cv-section cv-split">
        <div>
          <div className="cv-eyebrow">
            <T>{"03 / NO SPORT LEFT BEHIND"}</T>
          </div>
          <h2>
            <T>{"BEDA LAPANGAN."}</T>
            <br />
            <em>
              <T>{"SATU SEMANGAT."}</T>
            </em>
          </h2>
          <p>
            <T>
              {
                "Klub basket, akademi badminton, komunitas lari, hingga sekolah renang. Sesuaikan tim dan program dengan cara klubmu bergerak."
              }
            </T>
          </p>
          <a href="/sports" className="cv-textlink">
            <T>{"Temukan olahraga klubmu "}</T>
            <ArrowUpRight />
          </a>
        </div>
        <div className="cv-sportlist">
          {[
            "BASKETBALL / FOOTBALL",
            "BADMINTON / TENNIS",
            "SWIMMING / RUNNING",
            "MARTIAL ARTS / MORE",
          ].map((s, i) => (
            <a href="/sports" key={s}>
              <span>0{i + 1}</span>
              <strong>{s}</strong>
              <ArrowUpRight />
            </a>
          ))}
        </div>
      </section>
      <section className="cv-custom-teaser cv-section">
        <div className="cv-eyebrow">
          <T>{"04 / MADE FOR YOUR CLUB"}</T>
        </div>
        <h2>
          <T>{"NAMA KLUBMU."}</T>
          <br />
          <T>{"IDENTITASMU."}</T>
          <br />
          <em>
            <T>{"WEBSITE-MU."}</T>
          </em>
        </h2>
        <div>
          <p>
            <T>
              {
                "Courvix juga menjadi partner pembuatan website dan sistem khusus. Punya kebutuhan di luar platform? Mari susun solusinya."
              }
            </T>
          </p>
          <a href="/custom" className="cv-button">
            <T>{"Jelajahi layanan custom "}</T>
            <ArrowUpRight />
          </a>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function Platform() {
  return (
    <>
      <Intro
        label="PLATFORM / BUILT AROUND YOUR TEAM"
        title="SEMUA TERHUBUNG."
        accent="KLUB TERKELOLA."
        text="Enam fondasi untuk operasional klub. Satu pengalaman yang menghubungkan pengurus, pelatih, dan member."
      />
      <FieldFeature />
      <section className="cv-section cv-modulegrid">
        {modules.map((m, i) => (
          <article className="cv-module" key={m.title}>
            <div className="cv-feature-top">
              <m.icon size={30} />
              <span>
                <T>{"MODULE / 0"}</T>
                {i + 1}
              </span>
            </div>
            <h2>{m.title}</h2>
            <p>{m.text}</p>
            <p>{m.detail}</p>
          </article>
        ))}
      </section>
      <section className="cv-section cv-orange">
        <div className="cv-section-head">
          <h2>
            <T>{"PERAN BERBEDA."}</T>
            <br />
            <T>{"TUJUAN YANG SAMA."}</T>
          </h2>
          <p>
            <T>{"Jelajahi pembagian ruang kerja dalam demo Courvix."}</T>
          </p>
        </div>
        <Tabs defaultValue="Admin" className="cv-tabs">
          <TabsList>
            {["Administrator", "Admin", "Coach", "Member"].map((r) => (
              <TabsTrigger key={r} value={r}>
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
          {[
            [
              "Administrator",
              "PANTAU EKOSISTEM.",
              "Manage workspaces, review subscriptions and respond to support requests.",
            ],
            [
              "Admin",
              "KENDALIKAN OPERASIONAL.",
              "Kelola member, tim, jadwal, invoice, pengumuman, dan identitas website klub.",
            ],
            [
              "Coach",
              "FOKUS PADA LATIHAN.",
              "View your assigned groups, schedule and member attendance.",
            ],
            [
              "Member",
              "IKUTI PERKEMBANGANMU.",
              "Akses jadwal, status tagihan, riwayat pembayaran, serta informasi dari klub.",
            ],
          ].map(([role, title, text]) => (
            <TabsContent key={role} value={role}>
              <h3>{title}</h3>
              <p>{text}</p>
              <a className="cv-button dark" href="/demo">
                <T>{"Coba pilihan peran di demo "}</T>
                <ArrowUpRight />
              </a>
            </TabsContent>
          ))}
        </Tabs>
      </section>
      <section className="cv-section">
        <div className="cv-eyebrow">
          <T>{"FROM FIRST SIGN-UP TO EVERY SESSION"}</T>
        </div>
        <h2>
          <T>{"ALUR YANG MENGIKUTI"}</T>
          <br />
          <em>
            <T>{"HARI-HARI KLUBMU."}</T>
          </em>
        </h2>
        <div className="cv-steps">
          {[
            [
              "Susun tim",
              "Register members and assign them to training groups.",
            ],
            [
              "Run session",
              "Schedule sessions, assign coaches, then record attendance.",
            ],
            ["Rapikan iuran", "Create invoices and track payment status."],
            [
              "Evaluasi klub",
              "Use activity and transaction history for follow-up.",
            ],
          ].map(([a, b], i) => (
            <article key={a}>
              <span>0{i + 1}</span>
              <h3>{a}</h3>
              <p>{b}</p>
            </article>
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
const sports = [
  {
    group: "Tim",
    name: "Basket",
    detail:
      "Roster per kelompok usia, coach, jadwal latihan, dan iuran akademi.",
    tags: "U-16 · U-18 · Senior",
  },
  {
    group: "Tim",
    name: "Sepak bola & futsal",
    detail: "Kelompok pembinaan, agenda latihan, dan absensi tiap skuad.",
    tags: "SSB · Akademi · Komunitas",
  },
  {
    group: "Raket",
    name: "Badminton",
    detail: "Kelas berdasarkan level, sesi latihan, dan paket membership.",
    tags: "Pemula · Intermediate · Prestasi",
  },
  {
    group: "Raket",
    name: "Tenis & padel",
    detail: "Program reguler, kelompok latihan, dan penugasan pelatih.",
    tags: "Junior · Dewasa · Grup",
  },
  {
    group: "Individual",
    name: "Renang",
    detail:
      "Kelompok usia dan kemampuan, jadwal sesi, serta kehadiran peserta.",
    tags: "Dasar · Teknik · Kompetisi",
  },
  {
    group: "Individual",
    name: "Lari & atletik",
    detail: "Grup latihan, agenda komunitas, dan administrasi keanggotaan.",
    tags: "Track · Road · Community",
  },
  {
    group: "Bela diri",
    name: "Martial arts",
    detail: "Kelompok tingkatan, jadwal kelas, coach, dan riwayat latihan.",
    tags: "Karate · Taekwondo · Silat",
  },
  {
    group: "Tim",
    name: "Voli & olahraga lain",
    detail: "Flexible groups organized around your club’s needs.",
    tags: "Voli · Rugby · Cabang lainnya",
  },
];
export function Sports() {
  const [filter, setFilter] = useState("All");
  return (
    <>
      <Intro
        label="SPORTS / FIND YOUR FIELD"
        title="APAPUN LAPANGANNYA."
        accent="INI RUANG KLUBMU."
        text="Setiap olahraga punya ritme sendiri. Kelola fondasi yang sama, lalu susun kelompok, program, dan jadwal sesuai kebutuhan."
      />
      <FieldFeature variant="sports" />
      <section className="cv-section">
        <Tabs value={filter} onValueChange={setFilter} className="cv-tabs">
          <TabsList>
            {["All", "Tim", "Raket", "Individual", "Bela diri"].map((x) => (
              <TabsTrigger value={x} key={x}>
                {x}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={filter}>
            <div className="cv-sportgrid">
              {sports
                .filter((s) => filter === "All" || s.group === filter)
                .map((s, i) => (
                  <article key={s.name}>
                    <span className="cv-sport-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <small>{s.group.toUpperCase()}</small>
                    <h2>{s.name}</h2>
                    <p>{s.detail}</p>
                    <div>{s.tags}</div>
                  </article>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
      <section className="cv-section cv-orange cv-split">
        <h2>
          <T>{"STRUKTURNYA FLEKSIBEL."}</T>
          <br />
          <T>{"IDENTITASNYA"}</T>
          <br />
          <span className="cv-white">
            <T>{"TETAP MILIKMU."}</T>
          </span>
        </h2>
        <div>
          <p>
            <T>
              {
                "Gunakan tim untuk skuad, kelompok usia, kelas, atau level latihan. Buat jadwal dan iuran sesuai program yang berjalan."
              }
            </T>
          </p>
          <p>
            <T>
              {
                "Butuh scoring, booking lapangan, atau penilaian teknik yang spesifik? Fitur khusus cabang olahraga dibahas sebagai pengembangan custom."
              }
            </T>
          </p>
          <a href="/custom" className="cv-button dark">
            <T>{"Bahas sistem khusus "}</T>
            <ArrowUpRight />
          </a>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function Pricing() {
  const [amount, setAmount] = useState("350000"),
    [count, setCount] = useState("520"),
    [gateway, setGateway] = useState("0");
  const valid =
    /^\d+$/.test(amount) &&
    Number(amount) > 0 &&
    Number(amount) <= 100000000 &&
    /^\d+$/.test(count) &&
    Number(count) > 0 &&
    Number(count) <= 100000 &&
    /^\d+$/.test(gateway) &&
    Number(gateway) <= Number(amount);
  const fee = 0;
  return (
    <>
      <Intro
        label="PRICING / EVERY RUPIAH, CLEAR"
        title="BIAYA JELAS."
        accent="LANGKAH LEBIH PASTI."
        text="Pisahkan biaya langganan, fee platform, dan biaya penyedia pembayaran. Supaya klub tahu persis apa yang dihitung."
      />
      <section className="cv-section cv-plans">
        {[
          [
            "Starter",
            "250rb",
            "Untuk klub yang mengelola operasional secara mandiri.",
            "Member & profil pribadi|Tim, coach & lisensi|Jadwal, absensi & program latihan|Membership, invoice & payment|Panduan onboarding mandiri",
          ],
          [
            "Club Pro",
            "500rb",
            "Untuk klub yang membutuhkan pendampingan pengelolaan.",
            "Semua fitur Starter|Pendampingan setup awal klub|Bantuan penyiapan impor data|Sesi orientasi untuk admin & coach|Prioritas antrean dukungan",
          ],
        ].map(([name, price, desc, items], i) => (
          <article key={name} className={i === 1 ? "featured" : ""}>
            <small>
              {i === 1 ? "UNTUK KLUB YANG BERTUMBUH" : "RENCANA PAKET"}
            </small>
            <h3>{name}</h3>
            <div className="cv-plan-price">
              <T>{"Rp "}</T>
              {price}
              <span>
                <T>{"/month"}</T>
              </span>
            </div>
            <p>{desc}</p>
            <ul>
              {items.split("|").map((x) => (
                <li key={x}>
                  <Check size={17} />
                  {x}
                </li>
              ))}
            </ul>
            <a href="/register" className="cv-button">
              <T>{"Register your club "}</T>
              <ArrowUpRight size={18} />
            </a>
          </article>
        ))}
      </section>
      <p className="cv-caption">
        <T>
          {
            "Langganan dibayar klub setiap bulan, terpisah dari iuran member. Kedua paket memiliki fitur operasional yang sama; Club Pro menambah layanan pendampingan. Aktivasi dan pembayaran di demo masih simulasi. Website custom dihitung terpisah."
          }
        </T>
      </p>
      <section className="cv-section cv-orange cv-split" id="simulator">
        <div>
          <div className="cv-eyebrow">
            <T>{"PLATFORM FEE / SIMULATOR"}</T>
          </div>
          <h2>
            <T>{"KECIL PER TRANSAKSI."}</T>
            <br />
            <span className="cv-white">
              <T>{"JELAS HITUNGANNYA."}</T>
            </span>
          </h2>
          <p>
            <strong>
              <T>{"No per-payment platform fee in V1.0"}</T>
            </strong>
            <T>{". Biaya Courvix berasal dari paket langganan klub."}</T>
          </p>
          <p>
            <T>
              {
                "Member mentransfer iuran langsung ke rekening klub. Pengurus memverifikasi penerimaan dana. Langganan Courvix dibayarkan terpisah oleh klub."
              }
            </T>
          </p>
        </div>
        <div className="cv-calculator">
          <div className="cv-fieldgrid">
            <label>
              <T>{"Iuran per member (Rp)"}</T>
              <input
                type="number"
                min="1"
                max="100000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              <T>{"Member yang membayar"}</T>
              <input
                type="number"
                min="1"
                max="100000"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
            <label className="cv-full">
              <T>{"Biaya gateway per pembayaran (Rp)"}</T>
              <input
                type="number"
                min="0"
                max={amount}
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
              />
            </label>
          </div>
          {valid ? (
            <div aria-live="polite">
              <div className="cv-minirow">
                <span>
                  <T>{"Fee platform / pembayaran"}</T>
                </span>
                <strong>{money(fee)}</strong>
              </div>
              <div className="cv-minirow">
                <span>
                  <T>{"Total iuran untuk klub"}</T>
                </span>
                <strong>{money(Number(amount) * Number(count))}</strong>
              </div>
              <div className="cv-minirow">
                <span>
                  <T>{"Total fee platform"}</T>
                </span>
                <strong>{money(fee * Number(count))}</strong>
              </div>
              <div className="cv-minirow">
                <span>
                  <T>{"Total dibayar per member"}</T>
                </span>
                <strong>{money(Number(amount) + fee + Number(gateway))}</strong>
              </div>
              <div className="cv-calc-total">
                <span>
                  <T>{"Estimasi penerimaan klub*"}</T>
                </span>
                <strong>{money(Number(amount) * Number(count))}</strong>
              </div>
              <small>
                <T>
                  {
                    "*Penerimaan iuran sebelum langganan klub, pajak, dan refund. Biaya gateway terpisah; angka simulator bukan tarif resmi."
                  }
                </T>
              </small>
            </div>
          ) : (
            <p role="alert">
              <T>
                {
                  "Isi iuran dan jumlah member dengan bilangan bulat positif. Biaya gateway tidak boleh melebihi iuran."
                }
              </T>
            </p>
          )}
        </div>
      </section>
      <section className="cv-section cv-split">
        <div>
          <div className="cv-eyebrow">
            <T>{"GOOD QUESTIONS. CLEAR ANSWERS."}</T>
          </div>
          <h2>
            <T>{"SEBELUM"}</T>
            <br />
            <em>
              <T>{"MULAI LATIHAN."}</T>
            </em>
          </h2>
        </div>
        <div className="cv-faq">
          {[
            [
              "Apakah fee platform sama dengan biaya gateway?",
              "Berbeda. Fee platform adalah biaya layanan Courvix. Biaya gateway ditetapkan penyedia pembayaran dan dapat berbeda menurut metode transaksi. Angka gateway dalam simulator bukan tarif resmi.",
            ],
            [
              "Apakah semua klub harus punya iuran yang sama?",
              "Nominal iuran ditetapkan masing-masing klub. Pada V1.0, Courvix tidak menambahkan fee per pembayaran iuran.",
            ],
            [
              "Kapan fee dihitung?",
              "V1.0 uses manual payments verified by administrators. Automatic payment gateways and refunds are not enabled.",
            ],
            [
              "Bisakah membuat website sendiri?",
              "Bisa. Layanan website dan sistem custom memiliki ruang lingkup serta biaya terpisah, berdasarkan fitur dan kebutuhan integrasinya.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
export function Custom() {
  return (
    <>
      <Intro
        label="COURVIX STUDIO / YOUR DIGITAL HOME"
        title="KLUBMU PUNYA CERITA."
        accent="BERI PANGGUNGNYA."
        text="Lebih dari platform pengelolaan. Courvix membantu merancang website dan sistem yang membawa nama, karakter, dan cara kerja klubmu."
      />
      <section className="cv-custom-showcase">
        <div>
          <span>
            <T>{"CONCEPT WEBSITE / ATHLETICS ACADEMY"}</T>
          </span>
          <h2>
            <T>{"BUILD THE"}</T>
            <br />
            <T>{"NEXT"}</T>
            <br />
            <em>
              <T>{"GENERATION."}</T>
            </em>
          </h2>
          <p>
            <T>
              {"Profil klub. Program latihan. Jalan masuk untuk member baru."}
            </T>
          </p>
        </div>
        <img
          src="/courvix-track.webp"
          alt="Suasana latihan atlet sebagai contoh visual website olahraga"
          width="1536"
          height="1024"
          loading="lazy"
        />
      </section>
      <section className="cv-section">
        <div className="cv-section-head">
          <h2>
            <T>{"DARI PROFIL KLUB."}</T>
            <br />
            <em>
              <T>{"SAMPAI SISTEM KHUSUS."}</T>
            </em>
          </h2>
          <p>
            <T>
              {
                "Pilih cakupan berdasarkan kebutuhan operasional dan pengalaman yang ingin diberikan kepada member."
              }
            </T>
          </p>
        </div>
        <div className="cv-featuregrid">
          {[
            [
              "Club website",
              "Profil, program, coach, fasilitas, galeri, dan informasi pendaftaran dengan identitas visual klub.",
            ],
            [
              "Member portal",
              "Ruang member untuk mengakses jadwal, tagihan, dan informasi klub dalam alur yang terintegrasi.",
            ],
            [
              "Custom system",
              "Pemetaan dan pengembangan alur khusus seperti booking, penilaian, atau integrasi sistem yang sudah digunakan.",
            ],
          ].map(([a, b], i) => (
            <article className="cv-feature" key={a}>
              <span>
                0{i + 1}
                <T>{"/ SERVICE"}</T>
              </span>
              <h3>{a}</h3>
              <p>{b}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="cv-section cv-orange">
        <div className="cv-eyebrow">
          <T>{"A COLLABORATIVE PROCESS"}</T>
        </div>
        <h2>
          <T>{"DIBANGUN BERSAMA."}</T>
          <br />
          <span className="cv-white">
            <T>{"DARI AWAL SAMPAI SIAP."}</T>
          </span>
        </h2>
        <div className="cv-steps">
          {[
            [
              "Discovery",
              "Petakan pengguna, kebutuhan klub, dan prioritas fitur.",
            ],
            [
              "Design",
              "Susun struktur halaman, alur, dan visual untuk disepakati.",
            ],
            [
              "Build & test",
              "Bangun sistem dan uji alur utama bersama tim klub.",
            ],
            [
              "Launch & handover",
              "Siapkan publikasi, dokumentasi, dan pelatihan pengelolaan.",
            ],
          ].map(([a, b], i) => (
            <article key={a}>
              <span>0{i + 1}</span>
              <h3>{a}</h3>
              <p>{b}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="cv-section cv-split">
        <h2>
          <T>{"BUKAN SATU UKURAN"}</T>
          <br />
          <em>
            <T>{"UNTUK SEMUA KLUB."}</T>
          </em>
        </h2>
        <div>
          <p>
            <T>
              {
                "Ruang lingkup, jadwal pengerjaan, biaya hosting, domain, kepemilikan hasil, dan dukungan pemeliharaan dibahas sebelum proyek dimulai."
              }
            </T>
          </p>
          <p>
            <T>
              {
                "Ceritakan tujuan klub, jumlah member, serta sistem yang sedang digunakan. Kita mulai dari kebutuhan yang paling penting."
              }
            </T>
          </p>
          <a className="cv-button" href="/contact">
            <T>{"Susun kebutuhan proyek "}</T>
            <ArrowUpRight />
          </a>
        </div>
      </section>
    </>
  );
}
export function Contact() {
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    if (
      !String(f.get("name")).trim() ||
      !String(f.get("club")).trim() ||
      !String(f.get("message")).trim()
    ) {
      setError("Complete the name, workspace and requirements.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "brief",
          name: String(f.get("club")),
          contact: String(f.get("name")),
          email: String(f.get("email")),
          description: String(f.get("message")),
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw Error(
          result.error || "The request could not be saved. Try again.",
        );
      setStatus(
        "Brief tersimpan di demo. Lihat melalui peran Administrator → Projects. Belum dikirim ke tim Courvix.",
      );
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kendala. Try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Intro
        label="CONTACT / LET’S TALK SPORT"
        title="LANGKAH BESAR."
        accent="MULAI DARI OBROLAN."
        text="Butuh pengelolaan klub yang lebih rapi atau website dengan karakter sendiri? Mulai dengan ceritakan kebutuhanmu."
      />
      <section className="cv-section cv-contact">
        <aside>
          <div className="cv-eyebrow">
            <T>{"TELL US YOUR GAME PLAN"}</T>
          </div>
          <h2>
            <T>{"KITA MULAI"}</T>
            <br />
            <T>{"DARI "}</T>
            <em>
              <T>{"KLUBMU."}</T>
            </em>
          </h2>
          <p>
            <T>
              {
                "Brief yang jelas membantu menentukan prioritas, cakupan, dan langkah implementasi."
              }
            </T>
          </p>
          <ol>
            <li>
              <T>{"Ceritakan cabang olahraga dan skala klub."}</T>
            </li>
            <li>
              <T>{"Tuliskan kendala operasional saat ini."}</T>
            </li>
            <li>
              <T>{"Sebutkan fitur serta target waktu yang diharapkan."}</T>
            </li>
          </ol>
          <div className="cv-contact-note">
            <strong>
              <T>{"Masih eksplorasi?"}</T>
            </strong>
            <p>
              <T>
                {
                  "Try the dashboard with sample data and simulated transactions."
                }
              </T>
            </p>
            <a href="/demo" className="cv-textlink">
              <T>{"Buka demo "}</T>
              <ArrowUpRight />
            </a>
          </div>
        </aside>
        <form className="cv-form" onSubmit={submit}>
          <h3>
            <T>{"BRIEF KLUBMU"}</T>
          </h3>
          <p>
            <T>
              {
                "Formulir demo. Disimpan untuk simulasi, belum mengirim email atau pesan ke tim Courvix."
              }
            </T>
          </p>
          <div className="cv-fieldgrid">
            <label>
              <T>{"Full name"}</T>
              <input
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
            <label>
              <T>{"Club name"}</T>
              <input
                name="club"
                required
                maxLength={150}
                placeholder="Club / academy name"
              />
            </label>
            <label className="cv-full">
              <T>{"Email"}</T>
              <input
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
                placeholder="name@club.com"
              />
            </label>
            <label className="cv-full">
              <T>{"Ceritakan kebutuhan klub"}</T>
              <textarea
                name="message"
                required
                minLength={15}
                maxLength={2000}
                rows={5}
                placeholder="Cabang olahraga, jumlah member, kebutuhan fitur, dan rencana website..."
              />
            </label>
          </div>
          <button className="cv-button" disabled={busy}>
            {busy ? "Menyimpan brief…" : "Simpan brief demo"}
            <ArrowUpRight />
          </button>
          {error && (
            <p className="cv-error" role="alert">
              {error}
            </p>
          )}
          {status && (
            <p className="cv-success" role="status">
              {status}
            </p>
          )}
        </form>
      </section>
    </>
  );
}
