export interface PostRegistro {
  id_post: number;
  vincularImagem?: string;
  titulo: string;
  descricao?: string;
  id_categoria: number;
  status?: string;
  id_organizacao: number;
  id_pessoa_organizacao?: number;
  nome_organizacao?: string;
  foto_organizacao?: string | null;
  descricao_categoria?: string;
}

export interface UsuarioLogado {
  id_pessoa_login: number;
  username: string;
  tipo: string;
  nome?: string;
  foto?: string | null;
}
