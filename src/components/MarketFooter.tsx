import { Link } from "@tanstack/react-router";
import { useNotify } from "../app/providers";
import { Button } from "./ui/button";
import { SocialLinks } from "./SocialLinks";
export function MarketFooter() {
  const notify = useNotify();
  return (
    <footer className="market-footer">
      <div className="footer-features" id="learn">
        {[
          [
            "W",
            "Segurança da carteira",
            "Proteja sua carteira e colecione arte digital verificada com confiança.",
          ],
          [
            "C",
            "Criadores em destaque",
            "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
          ],
          [
            "D",
            "Alertas de lançamentos",
            "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
          ],
        ].map(([mark, title, text]) => (
          <article key={mark}>
            <span className="feature-medallion">{mark}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
        <div className="newsletter">
          <h2>Antecipe-se ao próximo lançamento</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              notify(
                "Inscrição simulada. Nenhum e-mail foi enviado ou armazenado.",
              );
              e.currentTarget.reset();
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              E-mail para novidades
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="digite seu e-mail..."
            />
            <Button>Enviar</Button>
          </form>
          <p>
            Receba lançamentos selecionados, histórias de criadores e novidades
            do mercado.
          </p>
        </div>
      </div>
      <div className="footer-brand">
        <strong>KURIO</strong>
        <p>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="footer-columns">
        <div>
          <h2>Meu perfil</h2>
          <Link to="/profile">Meu perfil</Link>
          <Link to="/wallets">Minhas carteiras</Link>
          <Link to="/cart">Minha coleção</Link>
          <p>Atividade</p>
          <p>Lista de interesse</p>
        </div>
        <div>
          <h2>Central de ajuda</h2>
          <a href="#learn">Como comprar NFTs</a>
          <a href="#learn">Carteira e segurança</a>
          <p>Política do mercado</p>
          <a
            href="https://github.com/junglegaming/frontend-challenge"
            target="_blank"
            rel="noreferrer"
          >
            Sobre este desafio
          </a>
        </div>
        <div>
          <h2>Coleções</h2>
          <Link to="/" search={{ category: "Art" }}>
            Arte digital
          </Link>
          <Link to="/" search={{ category: "Photography" }}>
            Fotografia
          </Link>
          <Link to="/" search={{ category: "Collectibles" }}>
            Colecionáveis
          </Link>
          <p>Música</p>
          <p>Utilidade</p>
        </div>
        <div className="footer-community">
          <h2>Redes sociais</h2>
          <div className="footer-social">
            <SocialLinks />
          </div>
          <h2>Carteiras compatíveis</h2>
          <p className="wallet-chip">
            <span>METAMASK</span>
            <span aria-hidden="true">•</span>
            <span>WALLETCONNECT</span>
            <span aria-hidden="true">•</span>
            <span>COINBASE</span>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Kurio. Propriedade digital para todos.</p>
      </div>
    </footer>
  );
}
