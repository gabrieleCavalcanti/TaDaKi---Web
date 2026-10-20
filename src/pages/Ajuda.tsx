import { ArrowLeft, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../css/Institucional.css";
const faq=[
 ["Como encontrar negócios perto de mim?","Acesse a Home e escolha sua região. As organizações são apresentadas conforme a localização cadastrada e seus interesses."],
 ["Como curtir uma publicação?","Toque ou clique no coração de uma publicação. Você poderá rever as publicações curtidas na área Minhas curtidas."],
 ["Como favoritar uma organização?","Entre no perfil da organização ou utilize o ícone de favorito disponível para contas de cliente. As novidades aparecem na aba Favoritas."],
 ["Quem pode criar publicações?","Somente contas do tipo organização podem criar publicações. O botão Criar publicação aparece na Home dessas contas."],
 ["Como criar uma publicação?","Na Home de uma organização, clique em Criar publicação, preencha os dados, escolha a categoria, adicione a foto e confirme."],
 ["O que aparece na Dashboard?","Contas de organização podem acompanhar curtidas, favoritos e sua publicação em destaque. Os indicadores dependem dos dados salvos na plataforma."],
 ["Como alterar meu perfil?","Acesse Meu perfil no menu de navegação para consultar os dados da sua conta."],
 ["Por que não encontro uma publicação?","Verifique a busca, os filtros e a região selecionada. Publicações arquivadas não aparecem na vitrine."],
];
export default function Ajuda(){const navigate=useNavigate();return <main className="institutional-page"><div className="institutional-shell"><button className="institutional-back" onClick={()=>navigate(-1)}><ArrowLeft size={17}/> Voltar</button><div className="institutional-hero"><span>CENTRAL DE AJUDA</span><h1>Como podemos ajudar?</h1><p>Respostas às dúvidas mais frequentes sobre o TaDaKi.</p></div><div className="institutional-faq">{faq.map(([q,a])=><details key={q}><summary><HelpCircle size={18}/>{q}</summary><p>{a}</p></details>)}</div></div></main>}
