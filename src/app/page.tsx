import Link from "next/link";

const eventPages = [
  {
    href: "/2024-10-12",
    title: "2024年10月12日",
    description:
      "【アーカイブ】シャッターチャンス！ライブマップで浜松のフェス導線と来場者のつながりを俯瞰。",
    statusLabel: "アーカイブ",
    statusTone: "border-neutral-200 bg-neutral-50 text-neutral-600",
    ctaLabel: "アーカイブを開く",
  },
  {
    href: "/2025-10-12",
    title: "2025年10月12日",
    description:
      "【ライブ】シャッターチャンス！が撮りたくなる瞬間をデータ化し、商店街の商機へ変換。",
    statusLabel: "ライブ更新中",
    statusTone: "border-orange-300 bg-orange-50 text-orange-600",
    ctaLabel: "ライブダッシュボードを開く",
  },
];

export default function HomePage() {
  return (
    <div className="flex w-full justify-start">
      <div className="relative h-screen w-2/3 overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
        <div className="absolute inset-0 bg-linear-to-br from-orange-100 via-white to-blue-100" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-500 shadow-sm">
              SHUTTER CHANCE!
            </div>
            <h1 className="mt-6 max-w-xl space-y-3 text-5xl font-bold leading-tight text-neutral-900">
              <span className="block bg-linear-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
                シャッターチャンス！
              </span>
              <span className="block text-3xl font-semibold text-neutral-900">
                街をデータでつなぎ、機会を可視化するエンジン
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600">
              「シャッターチャンス！」は浜松市のイベントと商店街を横断し、人・場所・機会をデータで編み直す街の可視化エンジンです。
              来場者の撮影行動やSNSの熱量を資源化し、地域全体が自走できるビジネスチャンスへと変換します。
              シャッター街のイメージを反転させ、シャッターチャンスを街の再起動スイッチに変える未来を描きます。
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Vision Pillars
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>
                ・「シャッターチャンス！」が「シャッター街」を逆転発想の象徴に。
              </li>
              <li>
                ・シャッターチャンス！で撮りたくなる瞬間をデータ化し、一般消費者もまちづくりに参加。
              </li>
              <li>
                ・シャッターチャンス！の分析から、新たな収益機会と事業の自走を後押し。
              </li>
              <li>
                ・シャッターチャンス！が人と場所のつながりから多面的価値を生み出す仕組みへ。
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="ml-6 flex h-screen w-1/3 flex-col gap-6">
        <div className="rounded-lg border border-neutral-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            やらまいか音楽フェスティバル
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            シャッターチャンス！の現在稼働中およびアーカイブのシーンを選択し、街をデータでつなぐリアルタイム体験を始めましょう。
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          {eventPages.map((event) => (
            <li key={event.href}>
              <Link
                className="group flex h-full flex-col justify-between rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-400 hover:shadow-md"
                href={event.href}
              >
                <div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.1em] ${event.statusTone}`}
                  >
                    やらまいか音楽フェスティバル / {event.statusLabel}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-neutral-900">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {event.description}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition group-hover:gap-3">
                  {event.ctaLabel}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
