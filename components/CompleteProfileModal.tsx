import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

const CompleteProfileModal: React.FC = () => {
    const { completeUserProfile, isLoading, tempSessionUser } = useAuth();
    const [name, setName] = useState(tempSessionUser?.user_metadata?.full_name || '');
    const [role, setRole] = useState<Role>(Role.BROKER);
    const [localError, setLocalError] = useState<string | null>(null);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (name.trim().length < 2 || name.trim().length > 80) {
            setLocalError('O nome deve ter entre 2 e 80 caracteres.');
            return;
        }
        try {
            await completeUserProfile(name.trim(), role);
        } catch (err: any) {
            setLocalError(err.message || 'Falha ao salvar o perfil.');
        }
    };
    
    const inputClass = "appearance-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

    return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md p-6 sm:p-8 space-y-6 rounded-2xl bg-gray-900/50 border border-white/10 shadow-lg text-white">
                <div>
                    <h2 className="text-center text-2xl font-bold text-white">
                       Complete seu Cadastro
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-300">
                        Bem-vindo! Precisamos de mais algumas informações para continuar.
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input
                        id="name"
                        type="text"
                        required
                        className={inputClass}
                        placeholder="Seu Nome Completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <select
                        id="role"
                        required
                        className={inputClass}
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                    >
                        <option value={Role.BROKER} className="bg-gray-800">Corretor (Broker)</option>
                        <option value={Role.MANAGER} className="bg-gray-800">Gerente (Manager)</option>
                        <option value={Role.ADMIN} className="bg-gray-800">Admin</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed transition"
                    >
                        {isLoading ? 'Salvando...' : 'Salvar e Continuar'}
                    </button>
                    {localError && <p className="mt-2 text-sm text-red-400 text-center">{localError}</p>}
                </form>
            </div>
        </div>
    );
};

export default CompleteProfileModal;
