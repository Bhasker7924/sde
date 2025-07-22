export interface FormData{
    name:string;
    email: string;
    linkedin: string;
    aiIdea: string;
}

export interface Chatmessage{
    role:'user' | 'assistant';
    parts:string;
}