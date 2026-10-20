import { Heart, MapPin, Store, ArrowLeft, GraduationCap, Users, Lightbulb, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../css/Institucional.css";
const equipe = [
  {nome:"Gabriele Cavalcanti",funcao:"Scrum Master e Back-end"},
  {nome:"Manoela Campos",funcao:"Front-End"},
  {nome:"Helen Souza",funcao:"Mobile"},
  {nome:"Isabella Florentino",funcao:"DBA e QA"},
];
export default function Sobre(){const navigate=useNavigate();return <main className="institutional-page"><div className="institutional-shell">
<button className="institutional-back" onClick={()=>navigate(-1)}><ArrowLeft size={18}/> Voltar</button>
<section className="institutional-hero"><span>CONHEÇA O TADAKI</span><h1>Conectando clientes e microempresas</h1><p>Uma plataforma criada para aproximar pessoas dos empreendedores da própria região, dar visibilidade a pequenos negócios e fortalecer as conexões locais.</p></section>
<section className="institutional-story"><div><GraduationCap size={30}/><h2>Um projeto de Trabalho de Conclusão de Curso</h2><p>O TaDaKi nasceu como um projeto de TCC do curso de Desenvolvimento de Sistemas da Escola SENAI “Dr. Celso Charuri”, sob orientação de Izaias Maia.</p><p>A ideia é colocar a tecnologia a serviço da comunidade: ajudar clientes a descobrir negócios próximos e oferecer às microempresas uma vitrine digital para mostrar produtos, serviços e novidades.</p></div><div><Lightbulb size={30}/><h2>Por que criamos o TaDaKi?</h2><p>Pequenos empreendimentos nem sempre conseguem a mesma visibilidade das grandes marcas. Nosso projeto busca facilitar a descoberta de iniciativas locais e criar oportunidades de conexão entre quem oferece e quem procura.</p></div></section>
<div className="institutional-cards"><article><MapPin/><h2>Descubra perto de você</h2><p>Pesquise organizações e publicações da sua região, inclusive negócios que ainda não fizeram publicações.</p></article><article><Store/><h2>Uma vitrine para empreender</h2><p>Organizações apresentam produtos, serviços e novidades para a comunidade.</p></article><article><Heart/><h2>Crie conexões</h2><p>Curta publicações e favorite organizações para acompanhar negócios de que você gosta.</p></article></div>
<section className="institutional-team"><div className="institutional-team-heading"><Users size={28}/><div><h2>As criadoras do TaDaKi</h2><p>Conheça a equipe responsável por idealizar e desenvolver este TCC.</p></div></div><div className="institutional-team-grid">{equipe.map((pessoa,index)=><article key={pessoa.nome}><div className="institutional-avatar" aria-hidden="true">{String(index+1).padStart(2,"0")}</div><h3>{pessoa.nome}</h3><p>{pessoa.funcao}</p></article>)}</div></section>
<div className="institutional-footer"><Globe size={25}/><h2>TaDaKi — conexões que começam perto</h2><p>Desenvolvido como projeto acadêmico de TCC. Mais visibilidade para pequenos negócios e mais descobertas para a comunidade.</p></div></div></main>}
