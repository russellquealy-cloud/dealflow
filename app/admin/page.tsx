// ... existing code ...
                const response = await fetch('/api/diagnostics/email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: session.user.email }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                  console.error('❌ Email diagnostics failed:', {
                    status: response.status,
                    error: errorData,
                  });
                  alert(`❌ Email diagnostics failed: ${errorData.message || 'Unauthorized. Please ensure you are logged in as an admin.'}`);
                  return;
                }

                const data = await response.json();
                
                if (data.success) {
                  alert(`✅ Email diagnostics completed!\n\nCheck your inbox (${session.user.email}) for test emails.\n\nMagic Link: ${data.results?.magicLink?.success ? '✅' : '❌'}\nPassword Reset: ${data.results?.passwordReset?.success ? '✅' : '❌'}`);
                } else {
                  const errors = [
                    data.results?.magicLink?.error ? `Magic Link: ${data.results.magicLink.error}` : null,
                    data.results?.passwordReset?.error ? `Password Reset: ${data.results.passwordReset.error}` : null,
                  ].filter(Boolean).join('\n');
                  alert(`⚠️ Email diagnostics completed with errors:\n\n${errors || data.message || 'Unknown error'}\n\nCheck console for details.`);
                }
                
                console.log('📧 Email diagnostics result:', data);
              } catch (error) {
                console.error('Error running email diagnostics:', error);
                alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to run diagnostics'}`);
              }
// ... existing code ...
