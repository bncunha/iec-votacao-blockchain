
const tableElem = document.getElementById("table-body");
const candidateOptions = document.getElementById("candidate-options");
const voteForm = document.getElementById("vote-form");

var proposals = [];
var myAddress;
var eleicao;
const CONTRACT_ADDRESS = "0x33FFbeEEbBf4002766B580f14ed27eb4F2e66f79";


const ethEnabled = () => {
	if (window.ethereum) {
    		window.web3 = new Web3(window.ethereum);
    		window.ethereum.enable();
    		return true;
  	}
  	return false;
}

const getMyAccounts = accounts => {
	try {
		if (accounts.length == 0) {
			alert("Você não tem contas habilitadas no Metamask!");
		} else {
			myAddress = accounts[0];
			accounts.forEach(async myAddress => {
				console.log(myAddress + " : " + await window.web3.eth.getBalance(myAddress));
			});
		}
	} catch(error) {
		console.log("Erro ao obter contas...");
	}
};

window.addEventListener('load', async function() {

	if (!ethEnabled()) {
  		alert("Por favor, instale um navegador compatível com Ethereum ou uma extensão como o MetaMask para utilizar esse dApp!");
	}
	else {
		getMyAccounts(await web3.eth.getAccounts());

		eleicao = new web3.eth.Contract(VotingContractInterface, CONTRACT_ADDRESS);
		getCandidatos(populaCandidatos);
		setTimeout(() => {
			getCandidatos(populaCandidatos);
		}, 5000);
	}
});

function getCandidatos(callback)
{
	eleicao.methods.getProposalsCount().call(async function (error, count) {
		proposals = [];
		for (i=0; i<count; i++) {
			await eleicao.methods.getProposal(i).call().then((data)=>{
				var proposal = {
          				name : data.name,
          				voteCount : data.voteCount
      				};
				proposals.push(proposal);
 			});
		}
		if (callback) {
			callback(proposals);
		}

	});
}

function populaCandidatos(candidatos) {
	while(tableElem.rows.length > 0) {
		tableElem.deleteRow(0);
	}
	$("#candidate-options option").remove();
	candidatos.forEach((candidato, index) => {
		// Creates a row element.
		const rowElem = document.createElement("tr");

		// Creates a cell element for the name.
		const nameCell = document.createElement("td");
		nameCell.innerText = candidato.name;
		rowElem.appendChild(nameCell);

		// Creates a cell element for the votes.
		const voteCell = document.createElement("td");
		voteCell.id = "vote-" + candidato.name; 
		voteCell.innerText = candidato.voteCount;
		rowElem.appendChild(voteCell);

		// Adds the new row to the voting table.
		tableElem.appendChild(rowElem);

		// Creates an option for each candidate
		const candidateOption = document.createElement("option");
		candidateOption.value = index;
		candidateOption.innerText = candidato.name;
		candidateOptions.appendChild(candidateOption);
	});
}

function buscarEleitores() {

}

const toObject = (array) => array.reduce((prev, cur) => {
	prev[cur.name] = cur.value;
	return prev
}, {})

$("#give-right-form").submit(function(e) {
	e.preventDefault();
	const data = toObject($("#give-right-form").serializeArray())
	console.log(data)
	eleicao.methods.giveRightToVote(data.address, data.name)
	.send({from: myAddress})
	.then(() => buscarEleitores())
	.catch((error) => {
		console.error(error)
		alert('Erro! Consulte o log!')
	})
});

$("#add-candidate-form").submit((e) => {
	e.preventDefault();
	const data = toObject($("#add-candidate-form").serializeArray())
	console.log(data)
	eleicao.methods.addProposal(data.name)
	.send({from: myAddress})
	.then(() => getCandidatos(populaCandidatos))
	.catch((error) => {
		console.error(error)
		alert('Erro! Consulte o log!')
	})
})

$("#delegate-form").submit((e) => {
	e.preventDefault();
	const data = toObject($("#delegate-form").serializeArray())
	console.log(data)
	eleicao.methods.delegate(data.address)
	.send({from: myAddress})
	.then(() => buscarEleitores())
	.catch((error) => {
		console.error(error)
		alert('Erro! Consulte o log!')
	})
})


$("#btnVote").on('click',function(){
	candidato = $("#candidate-options").children("option:selected").val();

        eleicao.methods.vote(candidato).send({from: myAddress})
	       .on('receipt',function(receipt) {
			//getCandidatos(eleicao, populaCandidatos);
			windows.location.reaload(true);
		})
		.on('error',function(error) {
			console.log(error.message);
               		return;     
        	});  

});
