import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { useAppContext } from "@/utils/app-context";

const Auth = () => {
	const { login } = useAppContext();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const user = await login(formData);

			if (user) {
				navigate("/dashboard");
				return
			}
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4'>
			<Card className='w-full max-w-md shadow-lg border-primary/20'>
				<CardHeader className='space-y-1 text-center'>
					<div className='flex justify-center mb-4'>
						<div className='p-3 rounded-full bg-gradient-to-br from-primary to-secondary'>
							<GraduationCap className='h-8 w-8 text-primary-foreground' />
						</div>
					</div>
					<CardTitle className='text-2xl font-bold'>Login Admin</CardTitle>
					<CardDescription>Dashboard WR Supratman</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								placeholder='nama@example.com'
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='password'>Password</Label>
							<Input
								id='password'
								type='password'
								placeholder='••••••••'
								value={formData.password}
								onChange={(e) => setFormData({ ...formData, password: e.target.value })}
								required
							/>
						</div>

						<Button type='submit' className='w-full' disabled={loading}>
							{loading ? "Memproses..." : "Login"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default Auth;
