import { useEffect, useState } from "react";
import { LoaderCircle, Trophy } from "lucide-react";
import type { Tables } from "../../lib/supabase/database.types";
import {
  getAdminTeams,
  getBoothCurrencyLeaderboard,
  getPersonalLeaderboard,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

type RankingTab = "team" | "personal" | "booth";

export function AdminRankingsPage() {
  const { activeMembership } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [tab, setTab] = useState<RankingTab>("team");
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Tables<"teams">[]>([]);
  const [personal, setPersonal] = useState<
    Awaited<ReturnType<typeof getPersonalLeaderboard>>
  >([]);
  const [boothBoard, setBoothBoard] = useState<
    Awaited<ReturnType<typeof getBoothCurrencyLeaderboard>>
  >([]);

  useEffect(() => {
    if (!festivalId) return;
    void Promise.all([
      getAdminTeams(festivalId),
      getPersonalLeaderboard(festivalId),
      getBoothCurrencyLeaderboard(festivalId),
    ])
      .then(([teamRows, personalRows, boothRows]) => {
        setTeams([...teamRows].sort((a, b) => b.score - a.score));
        setPersonal(personalRows);
        setBoothBoard(boothRows);
      })
      .finally(() => setLoading(false));
  }, [festivalId]);

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span>RANKING</span>
          <h1>랭킹</h1>
          <p>팀, 개인, 부스 인기 순위를 한 곳에서 확인합니다.</p>
        </div>
      </header>
      <div className="admin-tabs">
        <button
          className={tab === "team" ? "selected" : ""}
          onClick={() => setTab("team")}
        >
          팀 순위
        </button>
        <button
          className={tab === "personal" ? "selected" : ""}
          onClick={() => setTab("personal")}
        >
          개인 순위
        </button>
        <button
          className={tab === "booth" ? "selected" : ""}
          onClick={() => setTab("booth")}
        >
          부스 인기 순위
        </button>
      </div>
      {loading ? (
        <div className="management-loading">
          <LoaderCircle /> 불러오는 중…
        </div>
      ) : (
        <section className="leaderboard admin-leaderboard">
          {tab === "team" &&
            (teams.length ? (
              teams.map((team, index) => (
                <article key={team.id}>
                  <strong>{index + 1}</strong>
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" />
                  ) : (
                    <i style={{ backgroundColor: team.primary_color }} />
                  )}
                  <span>
                    <b>{team.name}</b>
                    <small>{team.score.toLocaleString()} P</small>
                  </span>
                </article>
              ))
            ) : (
              <div className="management-empty">
                <Trophy />
                <h2>등록된 팀이 없어요.</h2>
              </div>
            ))}
          {tab === "personal" &&
            (personal.length ? (
              personal.map((row, index) => (
                <article key={row.user_id}>
                  <strong>{index + 1}</strong>
                  {row.avatar_url ? (
                    <img src={row.avatar_url} alt="" />
                  ) : (
                    <i style={{ backgroundColor: "#e5e5e5" }} />
                  )}
                  <span>
                    <b>{row.display_name}</b>
                    <small>{row.score.toLocaleString()} P</small>
                  </span>
                </article>
              ))
            ) : (
              <div className="management-empty">
                <Trophy />
                <h2>아직 미션을 완료한 사람이 없어요.</h2>
              </div>
            ))}
          {tab === "booth" &&
            (boothBoard.length ? (
              boothBoard.map((booth, index) => (
                <article key={booth.id}>
                  <strong>{index + 1}</strong>
                  {booth.logo_url ? (
                    <img src={booth.logo_url} alt="" />
                  ) : (
                    <i style={{ backgroundColor: booth.accent_color }} />
                  )}
                  <span>
                    <b>{booth.name}</b>
                    <small>{booth.ad_currency.toLocaleString()} 코인</small>
                  </span>
                </article>
              ))
            ) : (
              <div className="management-empty">
                <Trophy />
                <h2>등록된 부스가 없어요.</h2>
              </div>
            ))}
        </section>
      )}
    </main>
  );
}
