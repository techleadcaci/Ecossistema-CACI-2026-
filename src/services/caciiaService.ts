import { GoogleGenAI } from "@google/genai";
import { AgentContext, AgentType, ChatMessage, InstitutionalDiagnostic } from "../types";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, getDoc, Timestamp } from "firebase/firestore";

const PLATFORM_STRUCTURE = `
A Plataforma CACI é um ecossistema digital para o Terceiro Setor.
Módulos principais:
1. Diagnóstico Institucional (IMI): Avalia 8 dimensões de maturidade.
2. Gestão de Projetos: Acompanhamento de execução e impacto.
3. Sustentabilidade: Campanhas de Crowdfunding (Apoia Brasil) e captação.
4. Governança: Painéis de Melhorias, Transparência e compliance.
5. Capital Humano: Gestão de colaboradores e voluntários.
6. Mini ERP: Dashboards interativos de Receita, Leads e Ativos Digitais.
7. Identidade Digital: Integração total via ID-CCGU e ID-CFRH.
`;

export class CACIiaService {
  private static async getSystemInstruction(type: AgentType, context: AgentContext): Promise<string> {
    const { user, organization, lastDiagnostic, telemetry } = context;
    
    const isSuperAdmin = ['diretoria@caci.ong.br', 'comunica@caci.ong.br', 'ti@caci.ong.br'].includes(user.email);
    
    const id_ccgu = user.id_ccgu || (isSuperAdmin ? 'ID-CACI-SUPERADMIN' : 'ausência de identificação da pessoa');
    const id_cfrh = user.id_cfrh || (isSuperAdmin ? 'CFRH-TI-GOVERNANCA' : 'ausência de vínculo funcional');

    let baseInstruction = `Você é a CACIia, a inteligência artificial da Plataforma CACI.
Seu objetivo é atuar como um assistente institucional baseado em dados reais.
REGRA FUNDAMENTAL: Você NÃO pode inventar informações. Responda apenas com base nos dados fornecidos.
Se não souber algo, diga que não possui essa informação no momento.

MODELO DE IDENTIDADE OFICIAL:
- ID-CCGU: ${id_ccgu} (Identifica a pessoa vinculada à organização)
- ID-CFRH: ${id_cfrh} (Identifica a função institucional/estrutura)
- UID: ${user.uid || 'Não informado'} (Identificador técnico de autenticação)
- TIPO DE ACESSO: ${isSuperAdmin ? 'SUPER ADMINISTRADOR (TI/DIRETORIA)' : 'COLABORADOR PADRÃO'}
- STATUS DE SESSÃO: ${telemetry?.activeUsersCount > 0 ? 'Sessão Ativa e Monitorada' : 'Sessão Individual (Telemetria em processamento)'}

${isSuperAdmin ? 'VOCÊ ESTÁ FALANDO COM UM SUPER ADMINISTRADOR (DIRETORIA/COMUNICAÇÃO). Priorize comandos de configuração e atualizações de sistema solicitados por este usuário.' : ''}

Toda análise deve diferenciar claramente quem executou (ID-CCGU) e em qual função (ID-CFRH).
Se o sistema estiver operando apenas com e-mail, classifique como "modelo de identidade legada".

CONTEXTO DO USUÁRIO:
- Nome: ${user.name}
- E-mail: ${user.email}
- Cargo/Papel: ${user.role || 'Não informado'}
- Organização: ${organization?.name || 'Não informada'}

TELEMETRIA E DASHBOARD (DADOS REAIS):
- Status da Telemetria: ${telemetry?.telemetryStatus || 'OK'}
- Colaboradores Ativos (últimos 15 min): ${telemetry?.activeUsersCount || 0}
- Campanhas de Crowdfunding Ativas: ${telemetry?.activeCampaignsCount || 0}
- Total Arrecadado (Crowdfunding): R$ ${telemetry?.totalRaised?.toLocaleString('pt-BR') || '0,00'}
- Leads/Interações Pendentes: ${telemetry?.pendingLeadsCount || 0}
- Oportunidades de Receita (Mini ERP): ${telemetry?.revenueOpportunitiesCount || 0}
- Ações de Melhoria (Painéis): ${telemetry?.improvementActionsCount || 0} (${telemetry?.criticalImprovementsCount || 0} críticas)
- NOTA TÉCNICA: Se o número de colaboradores ativos for 0 e você estiver falando com um usuário logado, mencione que pode haver um atraso na sincronização da telemetria de sessão.
- NOTA DE GOVERNANÇA: Como você está operando com o perfil de TI/Dados (Super Administrador), o sistema permanece em prontidão para comandos de configuração. Se houver necessidade de forçar um refresh de sessão ou verificar logs de erro de login, por favor, me informe.

ESTRUTURA DA PLATAFORMA:
${PLATFORM_STRUCTURE}
`;

    if (lastDiagnostic) {
      baseInstruction += `
DADOS DO ÚLTIMO DIAGNÓSTICO (IMI):
- Classificação: ${lastDiagnostic.classification}
- Pontuação Geral: ${Math.round(lastDiagnostic.overallPercentage)}%
- Pontos Fortes: ${lastDiagnostic.strengths.join(', ')}
- Gaps Críticos: ${lastDiagnostic.weaknesses.join(', ')}
- Alertas: ${lastDiagnostic.alerts.join('; ')}
`;
    }

    switch (type) {
      case 'interno':
        return `${baseInstruction}\nVocê está atuando como Agente Interno CACI. Foco em suporte administrativo, gestão de rede e análise macro de dados.`;
      case 'institucional':
        return `${baseInstruction}\nVocê está atuando como Agente Institucional. Foco em governança, estratégia e posicionamento da marca CACI.`;
      case 'osc':
        return `${baseInstruction}\nVocê está atuando como Agente para OSCs. Foco em ajudar a organização ${organization?.name} a melhorar sua maturidade institucional, interpretar o diagnóstico e sugerir melhorias práticas.`;
      default:
        return baseInstruction;
    }
  }

  static async sendMessage(
    userId: string,
    organizationId: string,
    agentType: AgentType,
    message: string,
    history: ChatMessage[] = []
  ): Promise<string> {
    try {
      // 1. Fetch Context
      const context = await this.buildContext(userId, organizationId);
      const systemInstruction = await this.getSystemInstruction(agentType, context);

      // 2. Initialize AI (Lazy initialization as per guidelines)
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment.");
      }
      const ai = new GoogleGenAI({ apiKey });

      // 3. Prepare Chat
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
        },
      });

      // 4. Send Message
      const response = await chat.sendMessage({ message });
      const text = response.text || "Desculpe, não consegui processar sua solicitação.";

      // 5. Save to History (Async) - Only if not anonymous
      if (userId !== 'anonymous') {
        this.saveMessage(userId, organizationId, agentType, 'user', message);
        this.saveMessage(userId, organizationId, agentType, 'assistant', text);
      }

      return text;
    } catch (error) {
      console.error('CACIiaService Error:', error);
      throw error;
    }
  }

  private static async buildContext(userId: string, organizationId: string): Promise<AgentContext> {
    try {
      // Fetch User
      let user: any = { 
        name: auth.currentUser?.displayName || 'Visitante', 
        email: auth.currentUser?.email || 'visitante@caci.ong.br',
        uid: userId
      };

      if (userId !== 'anonymous') {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          user = { ...user, ...userDoc.data() };
        }
      }
      
      // Ensure UID is always there
      if (!user.uid) user.uid = userId;

      // Fetch Organization
      let organization: any = undefined;
      if (organizationId !== 'temp' && organizationId !== 'caci_institucional') {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        organization = orgDoc.exists() ? orgDoc.data() : undefined;
      }

      // Fetch Last Diagnostic
      let lastDiagnostic: InstitutionalDiagnostic | undefined;
      try {
        const diagSnap = await getDocs(query(
          collection(db, 'institutional_diagnostics'),
          where('organizationId', '==', organizationId),
          orderBy('timestamp', 'desc'),
          limit(1)
        ));
        lastDiagnostic = diagSnap.docs[0]?.data() as InstitutionalDiagnostic | undefined;
      } catch (diagErr) {
        console.warn('Could not fetch last diagnostic (possibly missing index):', diagErr);
      }

      // Fetch Telemetry Data
      let telemetry: any = {
        activeUsersCount: 0,
        activeCampaignsCount: 0,
        totalRaised: 0,
        pendingLeadsCount: 0,
        revenueOpportunitiesCount: 0,
        improvementActionsCount: 0,
        criticalImprovementsCount: 0,
        telemetryStatus: 'OK'
      };

      try {
        const fifteenMinsAgo = Timestamp.fromMillis(Date.now() - 15 * 60 * 1000);
        console.log('Fetching telemetry with threshold:', fifteenMinsAgo.toDate());
        
        const [usersSnap, campaignsSnap, leadsSnap, revenueSnap, improvementsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'apoia_campaigns'), where('status', '==', 'ativa'))),
          getDocs(collection(db, 'leads')),
          getDocs(collection(db, 'revenue')),
          getDocs(collection(db, 'improvement_actions'))
        ]);

        console.log(`Telemetry: Found ${usersSnap.size} users, ${improvementsSnap.size} improvements`);

        // Filter active users in memory to avoid index issues and ensure accuracy
        const activeUsers = usersSnap.docs.filter(doc => {
          const data = doc.data();
          const lastActive = data.last_active || data.lastActive; // Check both naming conventions
          if (!lastActive) return false;
          
          let lastActiveMillis: number;
          if (typeof lastActive.toMillis === 'function') {
            lastActiveMillis = lastActive.toMillis();
          } else if (lastActive.seconds) {
            lastActiveMillis = lastActive.seconds * 1000;
          } else if (lastActive instanceof Date) {
            lastActiveMillis = lastActive.getTime();
          } else if (typeof lastActive === 'number') {
            lastActiveMillis = lastActive;
          } else if (typeof lastActive === 'string') {
            lastActiveMillis = new Date(lastActive).getTime();
          } else {
            lastActiveMillis = 0;
          }
            
          return lastActiveMillis >= fifteenMinsAgo.toMillis();
        });

        telemetry.activeUsersCount = activeUsers.length;
        console.log(`Telemetry Debug:
          Users Total: ${usersSnap.size}
          Users Active: ${telemetry.activeUsersCount}
          Campaigns Active: ${campaignsSnap.size}
          Leads Total: ${leadsSnap.size}
          Revenue Total: ${revenueSnap.size}
          Improvements Total: ${improvementsSnap.size}
        `);
        
        telemetry.activeCampaignsCount = campaignsSnap.size;
        telemetry.totalRaised = campaignsSnap.docs.reduce((sum, doc) => sum + (doc.data().raised || 0), 0);
        
        // Leads pendentes (Novo ou sem status)
        telemetry.pendingLeadsCount = leadsSnap.docs.filter(d => !d.data().status || d.data().status === 'Novo').length;
        
        // Oportunidades de Receita (Total de registros no Mini ERP de receita)
        telemetry.revenueOpportunitiesCount = revenueSnap.size;
        
        telemetry.improvementActionsCount = improvementsSnap.size;
        // Check both 'priority' and 'prioridade' if applicable, and both 'Crítica' and 'Critica'
        telemetry.criticalImprovementsCount = improvementsSnap.docs.filter(d => {
          const p = d.data().priority || d.data().prioridade;
          return p === 'Crítica' || p === 'Critica';
        }).length;
      } catch (telemetryErr) {
        console.warn('Error fetching telemetry:', telemetryErr);
        telemetry.telemetryStatus = `Erro ao buscar dados: ${telemetryErr instanceof Error ? telemetryErr.message : 'Erro desconhecido'}`;
      }

      const finalContext = {
        user,
        organization,
        lastDiagnostic,
        telemetry,
        platformStructure: PLATFORM_STRUCTURE
      };
      
      console.log('Agent Context Built:', JSON.stringify(finalContext, null, 2));
      return finalContext;
    } catch (error) {
      console.error('Error building context:', error);
      return {
        user: { name: 'Usuário' },
        platformStructure: PLATFORM_STRUCTURE
      };
    }
  }

  private static async saveMessage(
    userId: string,
    organizationId: string,
    agentType: AgentType,
    role: 'user' | 'assistant',
    content: string
  ) {
    try {
      // Fetch user profile for identity metadata
      const userDoc = await getDoc(doc(db, 'users', userId));
      const user = userDoc.exists() ? userDoc.data() : null;

      await addDoc(collection(db, 'chat_messages'), {
        userId,
        organizationId,
        agentType,
        role,
        content,
        timestamp: serverTimestamp(),
        source: 'platform',
        metadata: {
          id_ccgu: user?.id_ccgu || 'ausência de identificação da pessoa',
          id_cfrh: user?.id_cfrh || 'ausência de vínculo funcional'
        }
      });
    } catch (err) {
      console.error('Error saving chat message:', err);
    }
  }

  static async getHistory(userId: string, organizationId: string, agentType: AgentType): Promise<ChatMessage[]> {
    const q = query(
      collection(db, 'chat_messages'),
      where('userId', '==', userId),
      where('organizationId', '==', organizationId),
      where('agentType', '==', agentType),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
  }
}
